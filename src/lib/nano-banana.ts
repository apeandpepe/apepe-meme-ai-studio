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

function buildApepePrompt(translatedPrompt: string, styleSuffix: string) {
  return [
    "You are given reference images of a specific established cartoon character named APEPE. Use them ONLY to learn the CHARACTER's face and body identity — NOT its clothing.",
    "Redraw THIS SAME character in the requested scene. It must be instantly recognizable as APEPE, with a strong, fierce, tough vibe — NOT a soft, cute, or generic frog, and NOT Pepe the Frog.",
    "",
    "LOCKED FACE — reproduce these EXACT features in every image, identical to the reference, regardless of scene. This face is the core identity:",
    "- EYES: wide, glaring, intense eyes with thick heavy upper eyelids / eye-bags (no eyebrows at all — it is not human). The IRIS / eye color is a fixed reddish-orange / amber, exactly matching the reference — this specific eye color must be the same in every image. The eyes look fierce and determined. This eye look + color is the #1 signature.",
    "- BROW WRINKLES: a permanent furrowed, frowning crease above the nose / between the eyes — a tense scowling expression that conveys toughness. This wrinkle is ALWAYS present, even when smiling.",
    "- NOSE: a fixed upturned snub nose (pig-like / upturned), always.",
    "- MOUTH: a closed, set mouth (not gaping, not goofy).",
    "- FACE SHAPE: rounded but NOT chubby/puffy; the cheeks extend only very slightly past the outer corners of the eyes. A slight bit of jowl/under-chin. Solid and grounded, not bubbly or cartoonishly round like a typical frog meme.",
    "- SKIN: the same green skin tone and the same smooth illustrated texture/shading as the reference.",
    "",
    "Avoid drifting toward a generic green frog or Pepe — APEPE's furrowed brow, glaring heavy-lidded eyes, and upturned nose make it its own tough character. Keep that intensity.",
    "",
    "HEAD ALWAYS COVERED: the top of the head is NEVER bare — something always covers it.",
    "",
    "DO NOT COPY THE REFERENCE'S CLOTHING. The hood/outfit in the reference is just a default — it is NOT part of the identity. Unless asked, do not reproduce the reference's hood or clothes.",
    "",
    "FREELY CHANGE to fit the requested scene:",
    "- What covers the head: pick whatever fits the scene (crown for a king, helmet for a warrior, hat, cap, etc.). Only use a hood if nothing else fits.",
    "- The full outfit for the scene.",
    "- Expression (angry, happy, smug, etc.) — but ALWAYS keep the glaring heavy-lidded eyes and the furrowed brow wrinkle.",
    "- Pose, action, accessories, background.",
    "",
    "ABSOLUTE RULE — NO text, letters, words, captions, or writing anywhere in the image.",
    "",
    `Scene: ${translatedPrompt}.${styleSuffix}`,
    "",
    "Final check: wide glaring heavy-lidded eyes with the fixed reddish-orange/amber iris color, no eyebrows, permanent furrowed brow wrinkle above an upturned snub nose, closed set mouth, rounded-but-not-chubby green face with the reference texture, head covered to fit the scene, scene-appropriate outfit. Tough and fierce, not cute. No text. 1:1 square, high quality.",
  ].join(" ");
}

function buildGenericPrompt(translatedPrompt: string, styleSuffix: string) {
  return [
    "You are given one or more reference images of a specific established cartoon mascot character. Treat these reference images as the single source of truth for what the character looks like.",
    "Your task: redraw THIS SAME character (do not invent a different character) in the requested scene.",
    "The reference is the top priority. Even if the text request is short or vague, the character in your output must look essentially identical to the reference — same face, same body shape, same colors, same proportions, same art style and texture.",
    "",
    "Preserve from the reference (these define the character and must stay consistent): the overall body and head shape, the color palette, the key facial features, the materials/texture, and the clean illustrated cartoon art style.",
    "",
    "You MAY freely change: facial expression (happy, angry, sad, surprised, etc.), pose, action, accessories, outfit details, background, and overall scene — as long as the character stays clearly recognizable as the same one in the reference.",
    "",
    "ABSOLUTE RULE — NO text, letters, words, captions, or writing anywhere in the image.",
    "",
    `Scene: ${translatedPrompt}.${styleSuffix}`,
    "",
    "The result must look like the same character from the reference — same face, same colors, same art style and texture. No text. 1:1 square, high quality.",
  ].join(" ");
}

function buildPrompt(
  translatedPrompt: string,
  style?: string,
  project = "apepe",
  isEdit = false,
) {
  const styleSuffix =
    style && STYLE_ENHANCERS[style] ? ` ${STYLE_ENHANCERS[style]}` : "";

  if (isEdit) {
    // The LAST image provided is the base image to edit; earlier images are
    // the character references for consistency.
    return [
      "You are given reference images of an established character, followed by a BASE image (the most recent image) that was generated earlier.",
      "Your task: take the BASE image and modify ONLY what the request asks to change. Keep everything else as close to the base image as possible — same character, same composition, same style, same colors.",
      "Do not redraw from scratch. Edit the base image so it still clearly looks like a continuation of it.",
      "",
      "ABSOLUTE RULE — NO text, letters, words, captions, or writing anywhere in the image.",
      "",
      `Requested change: ${translatedPrompt}.${styleSuffix}`,
      "",
      "Output the edited image. Keep the same character identity and overall look as the base image. No text. 1:1 square, high quality.",
    ].join(" ");
  }

  if (project === "apepe") {
    return buildApepePrompt(translatedPrompt, styleSuffix);
  }
  return buildGenericPrompt(translatedPrompt, styleSuffix);
}

export type GenerateOptions = {
  prompt: string;
  style?: string;
  referenceImages?: string[];
  count?: number;
  project?: string;
  baseImage?: string; // data URL of a previously generated image to edit
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
  project = "apepe",
  baseImage,
}: GenerateOptions): Promise<GenerateResult> {
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }

  const isEdit = typeof baseImage === "string" && baseImage.length > 0;

  const translatedPrompt = await translatePrompt(prompt);
  const fullPrompt = buildPrompt(translatedPrompt, style, project, isEdit);

  // Use up to 3 references (e.g. front / side / back) for stronger
  // character consistency. The folder is sorted by filename.
  const limitedRefs = referenceImages.slice(0, 3);

  const parts: ContentPart[] = [{ text: fullPrompt }];

  for (const refImage of limitedRefs) {
    const match = refImage.match(/^data:(.+?);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: { mimeType: match[1], data: match[2] },
      });
    }
  }

  // In edit mode, append the base image LAST so it's the most recent context.
  if (isEdit && baseImage) {
    const match = baseImage.match(/^data:(.+?);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: { mimeType: match[1], data: match[2] },
      });
    }
  }

  console.log(
    `[nano-banana] Model: ${MODEL_ID} | Refs: ${limitedRefs.length} | Edit: ${isEdit} | Prompt: "${prompt}"`,
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
