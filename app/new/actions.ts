"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateCaptionAndPrompt } from "@/lib/anthropic";

export async function generateContentAction(theme: string, topic: string) {
  if (!theme.trim() || !topic.trim()) {
    throw new Error("Theme and topic/title are both required.");
  }
  return generateCaptionAndPrompt(theme, topic);
}

export async function createPostAction(input: {
  theme: string;
  title: string;
  caption: string;
  imagePrompt: string;
  scheduledDate?: string;
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
    },
  });

  // Revalidate the timeline so it picks up the new post immediately.
  revalidatePath("/timeline");
}
