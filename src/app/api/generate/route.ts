import { NextRequest, NextResponse } from "next/server";
import { generateImages } from "@/lib/nano-banana";
import { getApepeReferences } from "@/lib/references";
import { addWatermarks } from "@/lib/watermark";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style, project = "apepe", count = 4 } = body;

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

    if (project !== "apepe") {
      return NextResponse.json(
        { error: "Only APEPE is supported in this version" },
        { status: 400 },
      );
    }

    const referenceImages = await getApepeReferences();

    const result = await generateImages({
      prompt,
      style,
      referenceImages,
      count: safeCount,
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
