"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateCaptionAndPrompt, type ImageInput } from "@/lib/anthropic";

export async function generateContentAction(
  theme: string,
  topic: string,
  image?: ImageInput
) {
  if (!theme.trim() || !topic.trim()) {
    throw new Error("Theme and topic/title are both required.");
  }
  return generateCaptionAndPrompt(theme, topic, image);
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
