import { NextRequest, NextResponse } from "next/server";
import { generateImages } from "@/lib/nano-banana";
import { getReferences } from "@/lib/references";
import { addWatermarks } from "@/lib/watermark";
import { isProjectEnabled } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style, project = "apepe", count = 4, baseImage } = body;

    // Validate count — only allow 1, 2, or 4
    const safeCount = [1, 2, 4].includes(count) ? count : 4;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt too long (max 500 chars)" },
        { status: 400 },
      );
    }

    // Validate project id format (letters, numbers, dash, underscore)
    if (typeof project !== "string" || !/^[a-zA-Z0-9_-]+$/.test(project)) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    // Lock: only enabled projects can generate (others are "Soon" in UI).
    if (!isProjectEnabled(project)) {
      return NextResponse.json(
        { error: "This project is coming soon." },
        { status: 403 },
      );
    }

    // Load references for the selected project's folder.
    const referenceImages = await getReferences(project);

    if (referenceImages.length === 0) {
      return NextResponse.json(
        { error: "No reference images available for this project yet." },
        { status: 400 },
      );
    }

    const result = await generateImages({
      prompt,
      style,
      referenceImages,
      count: safeCount,
      project,
      baseImage:
        typeof baseImage === "string" && baseImage.startsWith("data:")
          ? baseImage
          : undefined,
    });

    // Add APEPE AI watermark to all generated images
    const watermarked = await addWatermarks(result.images);

    return NextResponse.json({ images: watermarked });
  } catch (err) {
    console.error("[/api/generate] error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
