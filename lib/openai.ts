import OpenAI, { toFile } from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your .env file or Vercel project settings."
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

type ImageQuality = "low" | "medium" | "high";

function extractImageDataUrl(response: OpenAI.Images.ImagesResponse): Promise<string> | string {
  const image = response.data?.[0];
  if (!image) {
    throw new Error("OpenAI didn't return an image.");
  }

  if (image.b64_json) {
    return `data:image/png;base64,${image.b64_json}`;
  }

  if (image.url) {
    return fetch(image.url)
      .then((res) => res.arrayBuffer())
      .then((buf) => `data:image/png;base64,${Buffer.from(buf).toString("base64")}`);
  }

  throw new Error("OpenAI response didn't include usable image data.");
}

/**
 * Generates an image from a text prompt using OpenAI's image model and
 * returns it as a base64 data URL, so it can be stored/displayed exactly
 * the same way as an uploaded reference image (same imageDataUrl field).
 *
 * Uses the full gpt-image-1 model (not the -mini variant) — mini trades
 * away meaningful text-rendering and detail fidelity for a lower price,
 * which matters a lot for a text-heavy branded template like this one.
 * Defaults to "low" quality for now while we dial in the style guide
 * wording — rough per-image cost at 1024x1536: ~$0.02 (low), ~$0.07
 * (medium), ~$0.25 (high). Bump back to "medium"/"high" once low-quality
 * output on the full model looks close enough to the ChatGPT reference;
 * pass an explicit `quality` value to override per call.
 *
 * If `referenceImageDataUrl` is provided (e.g. the brand reference image
 * or a previously generated post), this calls OpenAI's image *edit*
 * endpoint instead of pure text-to-image — the actual reference pixels
 * are sent to the model alongside the prompt, which is much closer to
 * what happens when you upload a reference image directly in ChatGPT,
 * and gives noticeably better brand/style fidelity than a text
 * description of the reference alone.
 */
export async function generateImageFromPrompt(
  prompt: string,
  options?: { quality?: ImageQuality; referenceImageDataUrl?: string }
): Promise<string> {
  const openai = getOpenAIClient();
  const quality: ImageQuality = options?.quality ?? "low";
  // Closest supported portrait size to the 4:5 (1080x1350) brand spec.
  const size = "1024x1536" as const;

  const referenceImageDataUrl = options?.referenceImageDataUrl;
  const match = referenceImageDataUrl?.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);

  if (match) {
    const [, mediaType, base64] = match;
    const ext = mediaType === "image/jpeg" ? "jpg" : mediaType.split("/")[1];
    const buffer = Buffer.from(base64, "base64");
    const file = await toFile(buffer, `reference.${ext}`, { type: mediaType });

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt,
      quality,
      size,
    });
    return extractImageDataUrl(response);
  }

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    quality,
    size,
  });
  return extractImageDataUrl(response);
}
