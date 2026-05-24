import sharp from "sharp";

/**
 * Add a subtle "APEPE AI" text watermark to the bottom-right corner of an image.
 * Input/output are base64 data URLs.
 */
export async function addWatermark(dataUrl: string): Promise<string> {
  try {
    const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) return dataUrl; // not a valid data URL, return as-is

    const mimeType = match[1];
    const base64 = match[2];
    const inputBuffer = Buffer.from(base64, "base64");

    // Get image dimensions
    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width ?? 1024;
    const height = metadata.height ?? 1024;

    // Scale watermark text relative to image size
    const fontSize = Math.round(width * 0.035);
    const padding = Math.round(width * 0.025);

    // SVG watermark - subtle white text with slight shadow, low opacity
    const watermarkSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="black" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text
          x="${width - padding}"
          y="${height - padding}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          fill="white"
          fill-opacity="0.45"
          text-anchor="end"
          filter="url(#shadow)"
        >APEPE AI</text>
      </svg>
    `;

    const watermarkBuffer = Buffer.from(watermarkSvg);

    const outputBuffer = await sharp(inputBuffer)
      .composite([{ input: watermarkBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    return `data:image/png;base64,${outputBuffer.toString("base64")}`;
  } catch (err) {
    console.error("[watermark] Failed to add watermark:", err);
    return dataUrl; // on failure, return original image
  }
}

/**
 * Add watermarks to multiple images in parallel.
 */
export async function addWatermarks(dataUrls: string[]): Promise<string[]> {
  return Promise.all(dataUrls.map((url) => addWatermark(url)));
}
