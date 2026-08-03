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
  image?: ImageInput,
  notes?: string
): Promise<GeneratedContent> {
  const anthropic = getAnthropicClient();

  const systemPrompt = `You write Instagram content for an account that teaches people how to use Claude AI (an assistant by Anthropic) in everyday life and small business. Tone: friendly, practical, a little playful, in Bahasa Indonesia unless the topic is clearly in English. Keep captions concise (under ~120 words), end with 3-6 relevant hashtags, and include a light call-to-action (e.g. "Coba yuk!" / "Save buat nanti"). If a reference image is provided, look at it closely and let the caption genuinely reflect what's shown in it, not just the topic text. The image prompt should describe a clean, modern, minimal social-media graphic (not a photo of a person) that visually represents the topic - suitable for an AI image generator.

Respond with ONLY raw JSON and nothing else — no markdown code fences (no \`\`\`), no commentary before or after, no leading/trailing whitespace beyond the object itself. The entire response body must be exactly this shape and nothing more:
{"caption": "...", "imagePrompt": "..."}`;

  const userText = `Theme: ${theme}\nTopic/idea: ${topic}${
    notes && notes.trim() ? `\nAdditional instructions: ${notes.trim()}` : ""
  }\n\nGenerate the caption and image prompt now.`;

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

  return parseGeneratedContent(raw);
}

/**
 * Parses Claude's JSON response into {caption, imagePrompt}. Handles the
 * common cases where the model wraps the JSON in markdown code fences or
 * adds stray text before/after it, so the caption box never ends up with
 * raw JSON dumped into it.
 */
function parseGeneratedContent(raw: string): GeneratedContent {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const tryParse = (text: string) => {
    const parsed = JSON.parse(text);
    return {
      caption: String(parsed.caption ?? "").trim(),
      imagePrompt: String(parsed.imagePrompt ?? "").trim(),
    };
  };

  try {
    return tryParse(cleaned);
  } catch {
    // Fallback: pull out the first {...} block in case there's still
    // stray text surrounding the JSON, and try again.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return tryParse(match[0]);
      } catch {
        // fall through to the final fallback below
      }
    }
    // Last resort: surface the raw text as the caption so nothing is
    // silently lost, but this should be rare now.
    return { caption: cleaned, imagePrompt: "" };
  }
}
