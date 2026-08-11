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

/**
 * Real brand context for belajarclaude.id, shared by both the single-post
 * and weekly-batch generators so every caption stays grounded in the
 * actual product instead of generic AI-education fluff.
 */
const BRAND_CONTEXT = `You write Instagram content for BelajarClaude (belajarclaude.id), positioned as "Belajar Claude untuk Kerja & Bisnis" — practical Claude AI courses and guides, entirely in Bahasa Indonesia, for professionals, UKM/small business owners, and students in Indonesia. Many followers are not very tech-savvy and are new to AI, so explain things simply without being condescending.

The platform sells one "All Access" package: Rp 399K, one-time payment, lifetime access to the whole course library including future courses (no subscription). The course library:
- "20 Prompt Dasar" — ready-to-use prompts for email, laporan, dan konten sosmed, tinggal copy-paste.
- "Dasar Claude AI" — dari nol sampai bisa pakai Claude untuk kebutuhan sehari-hari.
- "Produktivitas Kantor" — hemat 3-5 jam kerja per minggu pakai Claude dengan Gmail, Sheets, Docs, dan Claude Projects.
- "Kreasi Konten Pemasaran" — positioning, konten Instagram, copy iklan, sampai komunikasi pelanggan lewat WhatsApp.

Real workflow examples the brand uses to build trust (draw on these for ideas when relevant, don't force all of them in): a freelancer turning a messy WhatsApp brief into a scope of work + timeline + quote in 10 minutes; a content creator turning 1 topic into 15 pieces of content across platforms; an operations person turning a short story into a step-by-step SOP in 1 hour; a marketer generating 30 caption variations for a month of scheduled posts; a business owner getting a quick health check of sales/cashflow/team notes plus 3 priority actions; a sales manager producing 5 personalized partnership proposals via a prompt chain.

Tone: friendly, practical, encouraging, professional but approachable, a little playful is fine, never condescending. Captions should be concise (roughly 60-150 words), end with 3-6 relevant hashtags where natural, and include a light call-to-action — ideally pointing to belajarclaude.id or a relevant course above when it genuinely fits, without forcing a sales pitch into every single post.`;

export type ImageInput = {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
};

/**
 * Generates an Instagram caption + an AI image prompt for a given
 * theme/topic, using Claude. If a reference image is provided, Claude
 * looks at it (vision) and lets the caption reflect what's in it.
 *
 * Response format: plain text with CAPTION: / IMAGE_PROMPT: markers,
 * NOT JSON. Captions routinely contain literal double quotes (quoted
 * phrases, dialogue, "air quotes") which the model doesn't always escape
 * correctly inside a JSON string — that produced invalid JSON that then
 * fell through to a raw-text fallback, dumping the whole response into
 * the caption box with an empty image prompt. Plain text with simple
 * markers has no escaping to get wrong.
 */
export async function generateCaptionAndPrompt(
  theme: string,
  topic: string,
  image?: ImageInput,
  notes?: string,
  styleGuide?: string
): Promise<GeneratedContent> {
  const anthropic = getAnthropicClient();

  const styleInstructions = styleGuide
    ? `The image prompt you write MUST follow this exact brand visual style guide, adapting only the headline/content described below to fit the topic:\n${styleGuide}${
        image
          ? "\n\nA reference image is also attached, showing this style already applied to a real post — use it to double-check details like the logo, colors, and layout, but the style guide above is the authoritative spec."
          : ""
      }`
    : image
    ? "A reference image is provided — look at it closely and match its exact visual style (background, colors, layout, typography, icons) in the image prompt you write."
    : "The image prompt should describe a clean, modern, minimal social-media graphic (not a photo of a person) suitable for an AI image generator.";

  const specificityInstructions = `Write the image prompt with maximum, literal specificity so an AI image generator reproduces it exactly rather than approximately:
- Quote the EXACT on-image text word-for-word in quotation marks for every text element (headline, price/number, CTA button label, any bullet labels, etc). Never paraphrase or shorten it.
- State every color as its literal hex code (e.g. "background #5B3FC4"), never a vague color name, whenever the style guide gives one.
- Name the exact fonts for each text element when the style guide specifies them.
- Describe the exact layout, spacing, and logo placement from the style guide as concrete instructions, not a general impression.
- If additional instructions/notes are given below, make sure anything specific in them (exact wording, elements to include or exclude, layout tweaks) is reflected in the image prompt itself, not only the caption.`;

  const systemPrompt = `${BRAND_CONTEXT}

If a reference image is provided, also let the caption genuinely reflect what's shown in it, not just the topic text.

${styleInstructions}

${specificityInstructions}

Respond with ONLY the following two sections, in exactly this format, and nothing else — no JSON, no markdown code fences (no \`\`\`), no commentary before or after either section:

CAPTION:
<the full caption text goes here — quotes, emoji, hashtags, and line breaks are all fine, write it exactly as it should appear>

IMAGE_PROMPT:
<the full image prompt text goes here>`;

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
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  return parseGeneratedContent(raw);
}

/**
 * Revises an existing caption based on specific user feedback (e.g. "make
 * it shorter", "add more urgency", "remove the hashtags"), keeping the
 * same brand voice. The image prompt is left untouched by this call.
 *
 * Plain text response — a single string has nothing to escape, so this
 * is not susceptible to the JSON-parsing issue above at all.
 */
export async function reviseCaption(params: {
  theme: string;
  topic: string;
  currentCaption: string;
  feedback: string;
  notes?: string;
}): Promise<string> {
  const anthropic = getAnthropicClient();
  const { theme, topic, currentCaption, feedback, notes } = params;

  const systemPrompt = `${BRAND_CONTEXT}

You are revising an existing Instagram caption based on specific feedback from the person managing this account. Keep the brand voice and roughly the same length unless the feedback says otherwise. Apply the feedback precisely — don't rewrite parts that weren't flagged.

Respond with ONLY the revised caption text and nothing else — no JSON, no markdown code fences, no quotation marks wrapping the whole caption, no preamble like "Here's the revised caption:".`;

  const userText = `Theme: ${theme}\nTopic/idea: ${topic}${
    notes && notes.trim() ? `\nAdditional instructions: ${notes.trim()}` : ""
  }\n\nCurrent caption:\n${currentCaption}\n\nFeedback — revise the caption to address this:\n${feedback}\n\nWrite the revised caption now.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userText }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  return raw
    .trim()
    .replace(/^```(?:\w*)?\s*/, "")
    .replace(/```\s*$/, "")
    .replace(/^"([\s\S]*)"$/, "$1")
    .trim();
}

export type WeeklyPlanItem = {
  theme: string;
  title: string;
  caption: string;
  imagePrompt: string;
};

/**
 * Generates a batch of N Instagram posts (theme, title, caption, image
 * prompt) in one shot, for a weekly content plan. If a reference image is
 * provided, Claude examines it first and locks every image prompt to that
 * same visual style, only changing the headline/content per post.
 */
export async function generateWeeklyPlan(params: {
  count: number;
  themes: string[];
  audience: string;
  notes?: string;
  image?: ImageInput;
  styleGuide?: string;
  existingPosts?: { theme: string; title: string }[];
}): Promise<WeeklyPlanItem[]> {
  const anthropic = getAnthropicClient();
  const { count, themes, audience, notes, image, styleGuide, existingPosts } = params;

  const styleInstructions = styleGuide
    ? `Every image prompt you write MUST follow this exact brand visual style guide, adapting only the headline/content per post to fit each topic:\n${styleGuide}${
        image
          ? "\n\nA reference image is also attached, showing this style already applied to a real post — use it to double-check details like the logo, colors, and layout, but the style guide above is the authoritative spec."
          : ""
      }`
    : image
    ? "A reference image is attached — look at it closely first and identify its exact visual style: background, color palette, layout structure, typography, iconography, card/footer treatment, and branding elements. Every image prompt you write below must describe a new graphic that matches this exact style, changing only the headline/content per post."
    : "No reference image or style guide was provided — invent one consistent, clean, modern, minimal visual style (soft color palette, simple layout, friendly icons) and describe it identically across every image prompt below so the whole batch looks like one cohesive series.";

  const specificityInstructions = `Write every image prompt with maximum, literal specificity so an AI image generator reproduces it exactly rather than approximately:
- Quote the EXACT on-image text word-for-word in quotation marks for every text element (headline, price/number, CTA button label, any bullet labels, etc). Never paraphrase or shorten it.
- State every color as its literal hex code (e.g. "background #5B3FC4"), never a vague color name, whenever the style guide gives one.
- Name the exact fonts for each text element when the style guide specifies them.
- Describe the exact layout, spacing, and logo placement from the style guide as concrete instructions, not a general impression.
- If additional instructions/notes are given below, make sure anything specific in them (exact wording, elements to include or exclude, layout tweaks) is reflected in every image prompt, not only the captions.`;

  const systemPrompt = `${BRAND_CONTEXT}

Target audience for this specific batch: ${audience}

${styleInstructions}

${specificityInstructions}

Rotate across these themes, distributing them naturally across the posts (repeat themes as needed to fill the count, weighting earlier themes in the list a bit more heavily): ${themes.join(
    ", "
  )}.

${
  existingPosts && existingPosts.length > 0
    ? `Do not repeat any of these already-planned or already-published posts — give every new post a distinct title and angle from all of them:\n${existingPosts
        .map((p) => `- [${p.theme}] ${p.title}`)
        .join("\n")}`
    : ""
}

${notes && notes.trim() ? `Additional instructions for this batch: ${notes.trim()}` : ""}

Generate exactly ${count} posts. Respond with ONLY a raw JSON array and nothing else — no markdown code fences, no commentary before or after. Each item must have exactly this shape:
{"theme": "...", "title": "...", "caption": "...", "imagePrompt": "..."}

Every string value must be valid JSON: escape any double quote characters that appear inside the caption or imagePrompt text as \\" so the result parses as valid JSON.`;

  const userText = `Generate the ${count}-post content plan now.`;

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
    max_tokens: 12000,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  return parseWeeklyPlan(raw);
}

function parseWeeklyPlan(raw: string): WeeklyPlanItem[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const tryParse = (text: string): WeeklyPlanItem[] => {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Expected a JSON array");
    return parsed.map((item: any) => ({
      theme: String(item?.theme ?? "").trim(),
      title: String(item?.title ?? "").trim(),
      caption: String(item?.caption ?? "").trim(),
      imagePrompt: String(item?.imagePrompt ?? "").trim(),
    }));
  };

  try {
    return tryParse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return tryParse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error("Claude didn't return a valid plan — try generating again.");
  }
}

/**
 * Parses Claude's response into {caption, imagePrompt}.
 *
 * Preferred format is plain text with CAPTION: / IMAGE_PROMPT: markers
 * (see generateCaptionAndPrompt above) — no escaping involved, so this
 * can't produce the "raw JSON dumped into caption" failure mode.
 *
 * A legacy JSON parser is kept as a fallback only, in case the model
 * ever reverts to the old JSON-shaped response despite the prompt.
 */
function parseGeneratedContent(raw: string): GeneratedContent {
  const cleaned = raw
    .trim()
    .replace(/^```(?:\w*)?\s*/, "")
    .replace(/```\s*$/, "")
    .trim();

  const markerMatch = cleaned.match(
    /CAPTION:\s*([\s\S]*?)\s*IMAGE_PROMPT:\s*([\s\S]*)$/i
  );
  if (markerMatch) {
    return {
      caption: markerMatch[1].trim(),
      imagePrompt: markerMatch[2].trim(),
    };
  }

  const tryParseJson = (text: string) => {
    const parsed = JSON.parse(text);
    return {
      caption: String(parsed.caption ?? "").trim(),
      imagePrompt: String(parsed.imagePrompt ?? "").trim(),
    };
  };

  try {
    return tryParseJson(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return tryParseJson(jsonMatch[0]);
      } catch {
        // fall through to the final fallback below
      }
    }
  }

  // Last resort: surface the raw text as the caption so nothing is
  // silently lost, but this should be rare now.
  return { caption: cleaned, imagePrompt: "" };
}
