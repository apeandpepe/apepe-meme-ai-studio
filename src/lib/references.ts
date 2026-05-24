import { readFile } from "fs/promises";
import path from "path";

/**
 * Load APEPE reference images from public/references/apepe/
 * These get sent to Nano Banana for character consistency.
 *
 * To add references:
 * 1. Drop PNG/JPG files into: public/references/apepe/
 * 2. Recommended: 3-5 high-quality images, 1024x1024 or higher
 * 3. Front-facing, clear character, minimal background works best
 */

const REFERENCE_FILENAMES = [
  "apepe-01.png",
  "apepe-02.png",
  "apepe-03.png",
  "apepe-04.png",
  "apepe-05.png",
];

let cachedReferences: string[] | null = null;

export async function getApepeReferences(): Promise<string[]> {
  // Cache in memory - references don't change at runtime
  if (cachedReferences) return cachedReferences;

  const baseDir = path.join(process.cwd(), "public", "references", "apepe");
  const loaded: string[] = [];

  for (const filename of REFERENCE_FILENAMES) {
    try {
      const filePath = path.join(baseDir, filename);
      const buffer = await readFile(filePath);
      const ext = path.extname(filename).toLowerCase().replace(".", "");
      const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
      const base64 = buffer.toString("base64");
      loaded.push(`data:${mimeType};base64,${base64}`);
    } catch (err) {
      // Skip missing files silently - they're optional
      // (we expect 3-5 references; if only 3 exist, that's fine)
    }
  }

  if (loaded.length === 0) {
    console.warn(
      "[references] No APEPE reference images found. Add files to public/references/apepe/",
    );
  }

  cachedReferences = loaded;
  return loaded;
}
