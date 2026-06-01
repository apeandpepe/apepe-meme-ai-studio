import { NextRequest, NextResponse } from "next/server";
import { generateImages as generateNano } from "@/lib/nano-banana";
import { generateImages as generateApepeImage } from "@/lib/inference-engine";
import { getReferences } from "@/lib/references";
import { addWatermarks } from "@/lib/watermark";
import { isProjectEnabled } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

// Detect a facial expression from the user's prompt (English + Korean).
// Returns one of: smile, grin, surprised, sad, angry — or "" for default.
function detectExpression(prompt: string): string {
  const p = prompt.toLowerCase();
  const has = (words: string[]) => words.some((w) => p.includes(w));

  // Order matters: check the more specific / stronger ones first.
  if (
    has([
      "angry", "furious", "rage", "mad", "fierce", "aggressive", "yelling",
      "shouting", "scowl", "화난", "화가", "분노", "성난", "빡친", "열받",
    ])
  )
    return "angry";
  if (
    has([
      "surprised", "shocked", "shock", "astonished", "amazed", "gasp",
      "wow", "놀란", "놀라", "충격", "깜짝",
    ])
  )
    return "surprised";
  if (
    has([
      "sad", "crying", "cry", "tears", "depressed", "gloomy", "upset",
      "unhappy", "슬픈", "슬퍼", "우울", "시무룩", "울", "눈물",
    ])
  )
    return "sad";
  if (
    has([
      "laughing", "laugh", "big smile", "grin", "grinning", "joyful",
      "cheerful", "활짝", "크게 웃", "함박", "웃음",
    ])
  )
    return "grin";
  if (
    has([
      "smile", "smiling", "happy", "glad", "content", "pleased",
      "웃는", "웃고", "미소", "행복", "기쁜",
    ])
  )
    return "smile";

  return "";
}

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

    let result: { images: string[] };

    if (project === "apepe") {
      // APEPE goes through the dedicated APEPE inference engine. The detected
      // expression is added as a text hint; identity is handled by the engine.
      const expression = detectExpression(prompt);
      const expressionHint = expression ? ` (${expression} expression)` : "";
      if (expression) {
        console.log(`[generate] APEPE expression detected: ${expression}`);
      }
      result = await generateApepeImage({
        prompt: prompt + expressionHint,
        style,
        count: safeCount,
      });
    } else {
      // Other coins: nano-banana with their reference folder.
      const referenceImages = await getReferences(project);
      if (referenceImages.length === 0) {
        return NextResponse.json(
          { error: "No reference images available for this project yet." },
          { status: 400 },
        );
      }
      result = await generateNano({
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
    }

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
