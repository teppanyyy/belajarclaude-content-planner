"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateCaptionAndPrompt, type ImageInput } from "@/lib/anthropic";
import { getBrandStyleGuide } from "@/lib/brand";
import { generateImageFromPrompt } from "@/lib/openai";

export async function generateContentAction(
  theme: string,
  topic: string,
  image?: ImageInput,
  notes?: string
) {
  if (!theme.trim() || !topic.trim()) {
    throw new Error("Theme and topic/title are both required.");
  }
  const styleGuide = await getBrandStyleGuide();
  return generateCaptionAndPrompt(theme, topic, image, notes, styleGuide);
}

export async function generateImageAction(
  imagePrompt: string,
  referenceImageDataUrl?: string
) {
  if (!imagePrompt.trim()) {
    throw new Error("Generate an image prompt first.");
  }
  return generateImageFromPrompt(imagePrompt.trim(), { referenceImageDataUrl });
}

export async function createPostAction(input: {
  theme: string;
  title: string;
  caption: string;
  imagePrompt: string;
  scheduledDate?: string;
  imageDataUrl?: string;
}) {
  if (!input.theme.trim() || !input.title.trim()) {
    throw new Error("Theme and title are required.");
  }

  await prisma.post.create({
    data: {
      theme: input.theme.trim(),
      title: input.title.trim(),
      caption: input.caption.trim() || null,
      imagePrompt: input.imagePrompt.trim() || null,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      imageDataUrl: input.imageDataUrl || null,
    },
  });

  // Revalidate the timeline so it picks up the new post immediately.
  revalidatePath("/timeline");
}
