import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file or Vercel project settings."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export type GeneratedContent = {
  caption: string;
  imagePrompt: string;
};

export type ImageInput = {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
};

/**
 * Generates an Instagram caption + an AI image prompt for a given
 * theme/topic, using Claude. If a reference image is provided, Claude
 * looks at it (vision) and lets the caption reflect what's in it.
 * Returns structured JSON.
 */
export async function generateCaptionAndPrompt(
  theme: string,
  topic: string,
  image?: ImageInput
): Promise<GeneratedContent> {
  const anthropic = getAnthropicClient();

  const systemPrompt = `You write Instagram content for an account that teaches people how to use Claude AI (an assistant by Anthropic) in everyday life and small business. Tone: friendly, practical, a little playful, in Bahasa Indonesia unless the topic is clearly in English. Keep captions concise (under ~120 words), end with 3-6 relevant hashtags, and include a light call-to-action (e.g. "Coba yuk!" / "Save buat nanti"). If a reference image is provided, look at it closely and let the caption genuinely reflect what's shown in it, not just the topic text. The image prompt should describe a clean, modern, minimal social-media graphic (not a photo of a person) that visually represents the topic - suitable for an AI image generator.

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{"caption": "...", "imagePrompt": "..."}`;

  const userText = `Theme: ${theme}\nTopic/idea: ${topic}\n\nGenerate the caption and image prompt now.`;

  const content: any = image
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: image.mediaType,
            data: image.base64,
          },
        },
        { type: "text", text: userText },
      ]
    : userText;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  try {
    const parsed = JSON.parse(raw.trim());
    return {
      caption: String(parsed.caption ?? "").trim(),
      imagePrompt: String(parsed.imagePrompt ?? "").trim(),
    };
  } catch {
    // Fallback: if Claude didn't return clean JSON, surface the raw text
    // as the caption so nothing is silently lost.
    return { caption: raw.trim(), imagePrompt: "" };
  }
}
