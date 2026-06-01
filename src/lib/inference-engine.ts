import { fal } from "@fal-ai/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

// APEPE Inference Engine
// ----------------------
// Core image generation pipeline for the APEPE character. The engine expands
// short user requests into rich scene descriptions, then runs them through the
// dedicated APEPE model on our inference backend. The backend call is isolated
// in callInferenceBackend() so it can be swapped without touching the pipeline.
// Prompt expansion uses Gemini (lightweight, already configured for translation).

const backendKey = process.env.APEPE_BACKEND_KEY;
if (!backendKey) {
  console.warn("[apepe-engine] APEPE_BACKEND_KEY is not set. Image generation will fail.");
}
fal.config({ credentials: backendKey ?? "" });

// APEPE model and its trigger token. The trigger word activates the trained
// character identity inside the model.
const APEPE_MODEL_URL =
  process.env.APEPE_MODEL_URL ??
  "https://v3b.fal.media/files/b/0a9bfe7a/P6xFPeXoDXv7pbQ3zGY5T_pytorch_lora_weights.safetensors";
const TRIGGER_WORD = "apepe";
const INFERENCE_ENDPOINT = "fal-ai/flux-lora";

// Model strength. Lower = more freedom for the scene/outfit, higher = stronger
// APEPE identity (face shape, proportions). 0.8-0.9 holds the face better;
// too low lets the base model drift. Tunable via env.
const MODEL_STRENGTH = process.env.APEPE_MODEL_STRENGTH
  ? parseFloat(process.env.APEPE_MODEL_STRENGTH)
  : 0.85;

// Gemini is used to expand and translate short prompts into rich scene specs.
const googleKey = process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(googleKey ?? "");
const EXPANSION_MODEL_ID = "gemini-2.5-flash-lite";

const STYLE_ENHANCERS: Record<string, string> = {
  cyberpunk: "cyberpunk neon city aesthetic with futuristic accessories",
  samurai: "traditional Japanese setting with cherry blossoms",
  pixel: "retro 16-bit pixel art style",
  "3d": "high-quality 3D render with studio lighting",
  anime: "anime style with cel-shading and vibrant colors",
};

/**
 * Expand a short user request into a detailed, structured English prompt
 * (expression, concept, pose, angle, background, outfit, extras) so the model
 * produces rich, well-composed results from minimal input. Also translates
 * Korean to English. Character appearance is intentionally NOT described —
 * the model owns APEPE's identity, and describing it fights the trained look.
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
    const model = genAI.getGenerativeModel({ model: EXPANSION_MODEL_ID });
    const result = await model.generateContent(instruction);
    const text = result?.response?.text?.();
    if (text && text.trim().length > 0) {
      const cleaned = text
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/\n/g, " ");
      console.log(`[apepe-engine] Expanded "${userPrompt}" -> "${cleaned}"`);
      return cleaned;
    }
  } catch (err) {
    console.warn("[apepe-engine] Expansion failed, using original:", err);
  }
  return userPrompt;
}

/**
 * Build the final prompt for the model.
 * The trigger word goes first so the model's learned APEPE identity is applied,
 * then the (expanded) scene description.
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

/**
 * Single call into the inference backend. Isolated so we can swap the backend
 * (e.g., to a self-hosted GPU cluster) without changing the rest of the engine.
 */
async function callInferenceBackend(
  prompt: string,
  negative: string,
): Promise<string | null> {
  const result = await fal.subscribe(INFERENCE_ENDPOINT, {
    input: {
      prompt,
      negative_prompt: negative,
      loras: [{ path: APEPE_MODEL_URL, scale: MODEL_STRENGTH }],
      image_size: "square_hd", // 1024x1024
      num_inference_steps: 30,
      guidance_scale: 4,
      num_images: 1,
      enable_safety_checker: true,
      output_format: "png",
    } as any,
  });

  // Result shape: { data: { images: [{ url, ... }] } } (client wraps in .data)
  const data = (result as { data?: { images?: Array<{ url?: string }> } })
    .data;
  return data?.images?.[0]?.url ?? null;
}

type GenerateParams = {
  prompt: string;
  style?: string;
  count: number;
};

/**
 * Run one full generation: call the backend, download, return as data URL so
 * the rest of the pipeline (watermark, client display) is backend-agnostic.
 */
async function generateSingle(
  prompt: string,
  negative: string,
): Promise<string | null> {
  try {
    const url = await callInferenceBackend(prompt, negative);
    if (!url) {
      console.error("[apepe-engine] No image URL in response");
      return null;
    }

    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      console.error(`[apepe-engine] Failed to download image: ${imgRes.status}`);
      return null;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("[apepe-engine] generateSingle error:", err);
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
    `[apepe-engine] gen | count: ${count} | strength: ${MODEL_STRENGTH} | prompt: "${finalPrompt}"`,
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
        console.error("[apepe-engine] image rejected:", r.reason);
    }

    if (images.length >= count) break;
    if (round < MAX_ROUNDS - 1) {
      console.warn(
        `[apepe-engine] Got ${images.length}/${count}, retrying ${count - images.length} more...`,
      );
    }
  }

  if (images.length === 0) {
    throw new Error("All image generations failed. Check server logs.");
  }

  console.log(`[apepe-engine] Successfully generated ${images.length}/${count} images`);
  return { images };
}
