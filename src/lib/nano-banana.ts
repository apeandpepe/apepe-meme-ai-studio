import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn(
    "[nano-banana] GOOGLE_AI_API_KEY is not set. Image generation will fail.",
  );
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

const MODEL_ID = "gemini-3-pro-image-preview";
const TRANSLATE_MODEL_ID = "gemini-2.5-flash-lite";

const STYLE_ENHANCERS: Record<string, string> = {
  cyberpunk: "Cyberpunk neon city aesthetic with futuristic accessories.",
  samurai: "Traditional Japanese setting with cherry blossoms.",
  pixel: "Retro 16-bit pixel art style.",
  "3d": "High-quality 3D render with studio lighting.",
  anime: "Anime style with cel-shading and vibrant colors.",
};

async function translatePrompt(userPrompt: string): Promise<string> {
  const hasNonAscii = /[^\x00-\x7F]/.test(userPrompt);
  if (!hasNonAscii) return userPrompt;

  try {
    const model = genAI.getGenerativeModel({ model: TRANSLATE_MODEL_ID });
    const result = await model.generateContent(
      [
        "Translate the following image-generation request into concise, natural English suitable for an AI image generator.",
        "Only output the English translation. No quotes, no explanation, no extra words.",
        "Keep the word APEPE unchanged if present.",
        "",
        `Request: ${userPrompt}`,
      ].join("\n"),
    );

    const text = result?.response?.text?.();
    if (text && text.trim().length > 0) {
      const cleaned = text.trim().replace(/^["']|["']$/g, "");
      console.log(`[nano-banana] Translated "${userPrompt}" -> "${cleaned}"`);
      return cleaned;
    }
  } catch (err) {
    console.warn("[nano-banana] Translation failed, using original:", err);
  }
  return userPrompt;
}

function buildPrompt(translatedPrompt: string, style?: string) {
  const styleSuffix =
    style && STYLE_ENHANCERS[style] ? ` ${STYLE_ENHANCERS[style]}` : "";

  return [
    "You are given a reference image of a specific established character named APEPE. Treat this reference image as the single source of truth for what APEPE looks like.",
    "Your task: redraw THIS SAME character (do not invent a new character) performing the requested scene.",
    "The reference is the priority. Even if the text request is short or vague, the character in your output must look essentially identical to the reference character — same face, same colors, same proportions, same art style.",
    "",
    "Match the reference EXACTLY for these signature traits (these never change):",
    "- The same green skin tone and smooth frog-like face shape",
    "- Reddish-orange eyes with red/amber irises and the same heavy upper eyelid shape — this eye color and eye shape is the most important signature and must stay even when the expression changes",
    "- The same brown hooded cloak with the hood up and a draped collar (head covering can change style to fit the scene, but is always present)",
    "- The same clean illustrated cartoon art style (smooth shading, not a photo, not a 3D figure)",
    "",
    "The reference shows a neutral grumpy expression by DEFAULT, but the expression is NOT fixed — freely change it to match the request (happy, laughing, smiling, angry, sad, surprised, crying, etc.). Keep the signature red eyes and eye shape recognizable through any expression.",
    "",
    "ABSOLUTE RULE — the head and hair are NEVER exposed. The head is always covered (hood by default; can become a hat, helmet, cap, or other headwear to fit the scene, but always present).",
    "",
    "ABSOLUTE RULE — NO text, letters, words, captions, or writing anywhere in the image.",
    "",
    "Adapt these freely to the request: facial expression (happy, angry, sad, etc. — but keep the red eyes), pose, action, accessories, outfit details, background, and scene.",
    "",
    `Scene: ${translatedPrompt}.${styleSuffix}`,
    "",
    "The result must look like the same APEPE character from the reference — same face, same red eyes, same art style. Head always covered. No text. 1:1 square, high quality.",
  ].join(" ");
}

export type GenerateOptions = {
  prompt: string;
  style?: string;
  referenceImages?: string[];
  count?: number;
};

export type GenerateResult = {
  images: string[];
};

type ContentPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

async function generateSingleImage(
  parts: ContentPart[],
  index: number,
): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const response = result?.response;
    if (!response) {
      console.warn(`[nano-banana] Image ${index}: no response object`);
      return null;
    }

    const candidates = response?.candidates;
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      console.warn(`[nano-banana] Image ${index}: no candidates`);
      try {
        const feedback = (response as { promptFeedback?: unknown })?.promptFeedback;
        if (feedback) {
          console.warn(
            `[nano-banana] Image ${index}: promptFeedback:`,
            JSON.stringify(feedback),
          );
        }
      } catch {
        // ignore
      }
      return null;
    }

    const candidate = candidates[0];
    if (!candidate) {
      console.warn(`[nano-banana] Image ${index}: candidate is null`);
      return null;
    }

    const finishReason = (candidate as { finishReason?: string })?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.warn(`[nano-banana] Image ${index}: finishReason "${finishReason}"`);
    }

    const content = candidate?.content;
    if (!content) {
      console.warn(
        `[nano-banana] Image ${index}: no content. finishReason: ${finishReason}`,
      );
      return null;
    }

    const contentParts = content?.parts;
    if (!contentParts || !Array.isArray(contentParts) || contentParts.length === 0) {
      console.warn(
        `[nano-banana] Image ${index}: no parts. finishReason: ${finishReason}`,
      );
      return null;
    }

    let firstImage: { inlineData: { data: string; mimeType: string } } | null = null;

    for (const part of contentParts) {
      try {
        if (part && typeof part === "object" && "inlineData" in part) {
          const inlineData = (
            part as { inlineData?: { data?: string; mimeType?: string } }
          ).inlineData;
          if (inlineData?.data && inlineData?.mimeType) {
            firstImage = {
              inlineData: { data: inlineData.data, mimeType: inlineData.mimeType },
            };
            break;
          }
        }
      } catch (err) {
        console.warn(`[nano-banana] Image ${index}: error processing part:`, err);
      }
    }

    if (!firstImage) {
      console.warn(`[nano-banana] Image ${index}: no valid image part`);
      for (const part of contentParts) {
        try {
          if (part && typeof part === "object" && "text" in part) {
            const text = (part as { text?: string }).text;
            if (text) console.warn(`[nano-banana] Image ${index}: text response:`, text);
          }
        } catch {
          // ignore
        }
      }
      return null;
    }

    return `data:${firstImage.inlineData.mimeType};base64,${firstImage.inlineData.data}`;
  } catch (err) {
    console.error(`[nano-banana] Image ${index} caught error:`, err);
    return null;
  }
}

export async function generateImages({
  prompt,
  style,
  referenceImages = [],
  count = 4,
}: GenerateOptions): Promise<GenerateResult> {
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  const translatedPrompt = await translatePrompt(prompt);
  const fullPrompt = buildPrompt(translatedPrompt, style);

  // Use ONLY the first reference (the signature illustration, sorted first)
  const limitedRefs = referenceImages.slice(0, 1);

  const parts: ContentPart[] = [{ text: fullPrompt }];

  for (const refImage of limitedRefs) {
    const match = refImage.match(/^data:(.+?);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: { mimeType: match[1], data: match[2] },
      });
    }
  }

  console.log(
    `[nano-banana] Model: ${MODEL_ID} | Refs: ${limitedRefs.length} | Prompt: "${prompt}"`,
  );

  const settledResults = await Promise.allSettled(
    Array.from({ length: count }, (_, i) => generateSingleImage(parts, i)),
  );

  const images: string[] = [];
  for (let i = 0; i < settledResults.length; i++) {
    const result = settledResults[i];
    if (result.status === "fulfilled" && result.value) {
      images.push(result.value);
    } else if (result.status === "rejected") {
      console.error(`[nano-banana] Image ${i} rejected:`, result.reason);
    }
  }

  if (images.length === 0) {
    throw new Error("All image generations failed. Check server logs for details.");
  }

  console.log(`[nano-banana] Successfully generated ${images.length}/${count} images`);
  return { images };
}
