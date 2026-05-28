import { readFile, readdir } from "fs/promises";
import path from "path";

/**
 * Load reference images for a given project from:
 *   public/references/{projectId}/
 *
 * Any PNG/JPG/JPEG/WEBP file in that folder is used as a reference,
 * sorted by filename (so e.g. "00" sorts first as the main reference).
 * These get sent to the image model for character consistency.
 *
 * To add references for a project:
 * 1. Create folder: public/references/{projectId}/
 * 2. Drop image files in (recommended 3-5, 1024x1024+, clear character)
 * 3. Name them so the main/front view sorts first (e.g. 00-front.png)
 */

const VALID_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

// Per-project in-memory cache. References don't change at runtime,
// so we cache each project's loaded base64 list after first read.
const cache = new Map<string, string[]>();

function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".webp") return "image/webp";
  return "image/png";
}

// Only allow simple folder ids (letters, numbers, dash, underscore)
// to prevent path traversal.
function isSafeProjectId(projectId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(projectId);
}

/**
 * Load all reference images for a project as base64 data URLs.
 * Returns [] if the folder is missing or empty.
 */
export async function getReferences(projectId: string): Promise<string[]> {
  if (!projectId || !isSafeProjectId(projectId)) {
    console.warn(`[references] Invalid projectId: "${projectId}"`);
    return [];
  }

  const cached = cache.get(projectId);
  if (cached) return cached;

  const baseDir = path.join(process.cwd(), "public", "references", projectId);
  const loaded: string[] = [];

  let files: string[] = [];
  try {
    files = await readdir(baseDir);
  } catch {
    // Folder doesn't exist yet - that's fine for locked/"Soon" projects.
    cache.set(projectId, []);
    return [];
  }

  // Keep only valid image files, sorted by name (00 first, etc.)
  const imageFiles = files
    .filter((f) => VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort();

  for (const filename of imageFiles) {
    try {
      const filePath = path.join(baseDir, filename);
      const buffer = await readFile(filePath);
      const mimeType = mimeFromExt(path.extname(filename));
      const base64 = buffer.toString("base64");
      loaded.push(`data:${mimeType};base64,${base64}`);
    } catch (err) {
      console.warn(`[references] Failed to read ${filename}:`, err);
    }
  }

  if (loaded.length === 0) {
    console.warn(
      `[references] No reference images found in public/references/${projectId}/`,
    );
  } else {
    console.log(
      `[references] Loaded ${loaded.length} reference(s) for "${projectId}": ${imageFiles.join(", ")}`,
    );
  }

  cache.set(projectId, loaded);
  return loaded;
}

/**
 * Backwards-compatible helper for APEPE specifically.
 */
export async function getApepeReferences(): Promise<string[]> {
  return getReferences("apepe");
}

/**
 * APEPE expression → which reference files to send.
 * The apepe folder is sorted: index 0..7 =
 *   0 front, 1 side, 2 back, 3 slight-smile, 4 surprised,
 *   5 sad, 6 big-grin, 7 angry.
 * For an expression we send the front (0) plus that expression's image,
 * so the model keeps the identity AND copies the exact expression we drew.
 * Default ("none") sends front/side/back (0,1,2).
 */
const EXPRESSION_INDEX: Record<string, number> = {
  smile: 3,
  surprised: 4,
  sad: 5,
  grin: 6,
  angry: 7,
};

export async function getApepeReferencesByExpression(
  expression?: string,
): Promise<string[]> {
  const all = await getReferences("apepe");
  if (all.length === 0) return [];

  // No / unknown expression → front, side, back (first three).
  if (!expression || !(expression in EXPRESSION_INDEX)) {
    return all.slice(0, 3);
  }

  const front = all[0];
  const exprIdx = EXPRESSION_INDEX[expression];
  const exprImg = all[exprIdx];

  // Order matters: the model weights the LAST image most heavily.
  // Put the expression image first (mood reference) and the front view
  // last so the front-facing identity/angle dominates.
  const picked: string[] = [];
  if (exprImg && exprImg !== front) picked.push(exprImg);
  if (front) picked.push(front);
  return picked;
}
