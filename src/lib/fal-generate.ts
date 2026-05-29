import { fal } from "@fal-ai/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

// fal.ai handles image generation via the trained APEPE LoRA.
// Translation still uses Gemini (cheap, and the key is already configured).

const falKey = process.env.FAL_KEY;
if (!falKey) {
  console.warn("[fal] FAL_KEY is not set. Image generation will fail.");
}
fal.config({ credentials: falKey ?? "" });

// The trained APEPE LoRA (from fal.ai training) and its trigger word.
const APEPE_LORA_URL =
  process.env.APEPE_LORA_URL ??
  "https://v3b.fal.media/files/b/0a9bfe7a/P6xFPeXoDXv7pbQ3zGY5T_pytorch_lora_weights.safetensors";
const TRIGGER_WORD = "apepe";
const FLUX_LORA_ENDPOINT = "fal-ai/flux-lora";

// LoRA strength. Lower = more freedom for the scene/outfit, higher = stronger
// APEPE identity (face shape, proportions). 0.8-0.9 holds the face better;
// too low lets the base model drift. Tunable via env.
const LORA_SCALE = process.env.APEPE_LORA_SCALE
  ? parseFloat(process.env.APEPE_LORA_SCALE)
  : 0.85;

// Gemini is only used to translate non-English prompts to English.
const googleKey = process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(googleKey ?? "");
const TRANSLATE_MODEL_ID = "gemini-2.5-flash-lite";

const STYLE_ENHANCERS: Record<string, string> = {
  cyberpunk: "cyberpunk neon city aesthetic with futuristic accessories",
  samurai: "traditional Japanese setting with cherry blossoms",
  pixel: "retro 16-bit pixel art style",
  "3d": "high-quality 3D render with studio lighting",
  anime: "anime style with cel-shading and vibrant colors",
};

/**
 * Expand a short user request into a detailed, structured English prompt
 * (expression, concept, pose, angle, background, outfit, extras) so the LoRA
 * produces rich, well-composed results from minimal input. Also translates
 * Korean to English. Character appearance is intentionally NOT described —
 * the LoRA owns APEPE's identity, and describing it fights the LoRA.
 */
async function expandPrompt(userPrompt: string): Promise<string> {
  const instruction = [
    "APEPE is a specific stylized character: a green creature (NOT a human), with a signature look — it always wears something on its head, and has distinctive sharp eyes. This identity is FIXED and rendered automatically.",
    "Your job: take a short request and write ONE prompt describing the SCENE for this APEPE character — its concept, outfit, pose, camera angle, background, lighting/mood.",
    "Rules:",
    "- NEVER turn APEPE into a human or realistic person. It is always this green creature character.",
    "- NEVER remove the head covering — APEPE always wears headwear that fits the scene (hat, helmet, crown, cap, hood...).",
    "- Do NOT describe its eyes, face, skin, body, gender, or species directly (those are rendered automatically) — and never contradict them.",
    "- Keep APEPE the clear main subject of the scene.",
    "- Default to a fierce, confident mood unless the request implies another (cute, sad, happy...).",
    "- Camera angle: default front-facing, but use a fitting angle when the scene calls for it. Lighting: match the scene.",
    "- Keep it SHORT: one line, ~20-30 words, comma-separated phrases. NO full sentences, no narration like 'The scene is...'.",
    "- Keep detail moderate — no busy props, tattoos, logos, or clutter.",
    "- If the request is unusual/abstract, interpret it into a natural visual scene.",
    "- No text or writing in the image.",
    "- Output ONLY the prompt, starting with 'apepe', comma-separated, English. No labels, no quotes.",
    "",
    `Request: ${userPrompt}`,
  ].join("\n");

  try {
    const model = genAI.getGenerativeModel({ model: TRANSLATE_MODEL_ID });
    const result = await model.generateContent(instruction);
    const text = result?.response?.text?.();
    if (text && text.trim().length > 0) {
      const cleaned = text
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/\n/g, " ");
      console.log(`[inference] Expanded "${userPrompt}" -> "${cleaned}"`);
      return cleaned;
    }
  } catch (err) {
    console.warn("[inference] Expansion failed, using original:", err);
  }
  return userPrompt;
}

/**
 * Build the final prompt for the LoRA.
 * The trigger word goes first so the LoRA's learned APEPE identity is applied,
 * then the user's (translated) scene description.
 */
function buildPrompt(expanded: string, style?: string): { prompt: string; negative: string } {
  const scene = expanded.trim().replace(/^apepe[\s,]+/i, "").trim();

  const wantsCute = /\b(cute|adorable|chibi|kawaii|귀여|깜찍)\b/i.test(scene);

  const styleSuffix =
    style && STYLE_ENHANCERS[style] ? `, ${STYLE_ENHANCERS[style]}` : "";

  // Expansion already added mood, headwear, scene detail, and "no text".
  // Here we just prepend the trigger word and add a light safety net.
  const prompt = `${TRIGGER_WORD}, ${scene}${styleSuffix}, ${TRIGGER_WORD} character, green creature, no text, square image`;

  const negative = wantsCute
    ? "text, watermark, signature, frog, pepe the frog, two heads, extra character, low quality, split face, facial seam, vertical line on face, mirrored face"
    : "text, watermark, signature, frog, pepe the frog, cute, chibi, two heads, extra character, low quality, split face, facial seam, vertical line on face, mirrored face";

  return { prompt, negative };
}

type GenerateParams = {
  prompt: string;
  style?: string;
  count: number;
};

async function generateSingle(
  prompt: string,
  negative: string,
): Promise<string | null> {
  try {
    const result = await fal.subscribe(FLUX_LORA_ENDPOINT, {
      input: {
        prompt,
        negative_prompt: negative,
        loras: [{ path: APEPE_LORA_URL, scale: LORA_SCALE }],
        image_size: "square_hd", // 1024x1024
        num_inference_steps: 30,
        guidance_scale: 4,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "png",
      } as Record<string, unknown>,
    });

    // Result shape: { data: { images: [{ url, ... }] } } (client wraps in .data)
    const data = (result as { data?: { images?: Array<{ url?: string }> } })
      .data;
    const url = data?.images?.[0]?.url;
    if (!url) {
      console.error("[fal] No image URL in response");
      return null;
    }

    // Download the image and return as a base64 data URL (so the rest of the
    // pipeline — watermark, client display — works exactly like before).
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      console.error(`[fal] Failed to download image: ${imgRes.status}`);
      return null;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("[fal] generateSingle error:", err);
    return null;
  }
}

export async function generateImages({
  prompt,
  style,
  count,
}: GenerateParams): Promise<{ images: string[] }> {
  const expanded = await expandPrompt(prompt);
  const { prompt: finalPrompt, negative } = buildPrompt(expanded, style);

  console.log(
    `[inference] gen | count: ${count} | scale: ${LORA_SCALE} | prompt: "${finalPrompt}"`,
  );

  const images: string[] = [];
  const MAX_ROUNDS = 3;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const remaining = count - images.length;
    if (remaining <= 0) break;

    const settled = await Promise.allSettled(
      Array.from({ length: remaining }, () =>
        generateSingle(finalPrompt, negative),
      ),
    );
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) images.push(r.value);
      else if (r.status === "rejected")
        console.error("[fal] image rejected:", r.reason);
    }

    if (images.length >= count) break;
    if (round < MAX_ROUNDS - 1) {
      console.warn(
        `[fal] Got ${images.length}/${count}, retrying ${count - images.length} more...`,
      );
    }
  }

  if (images.length === 0) {
    throw new Error("All image generations failed. Check server logs.");
  }

  console.log(`[fal] Successfully generated ${images.length}/${count} images`);
  return { images };
}
