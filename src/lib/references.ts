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
