"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  generateWeeklyPlan,
  type WeeklyPlanItem,
  type ImageInput,
} from "@/lib/anthropic";
import { getBrandStyleGuide } from "@/lib/brand";
import { generateImageFromPrompt } from "@/lib/openai";

export async function generateWeeklyPlanAction(input: {
  count: number;
  themes: string[];
  audience: string;
  notes?: string;
  image?: ImageInput;
}) {
  if (!Number.isFinite(input.count) || input.count < 1 || input.count > 21) {
    throw new Error("Choose a post count between 1 and 21.");
  }
  if (input.themes.length === 0) {
    throw new Error("Add at least one theme to rotate through.");
  }
  if (!input.audience.trim()) {
    throw new Error("Describe your target audience so Claude can write for them.");
  }

  const [styleGuide, existingPosts] = await Promise.all([
    getBrandStyleGuide(),
    prisma.post.findMany({
      select: { theme: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
  ]);

  return generateWeeklyPlan({ ...input, styleGuide, existingPosts });
}

export async function generateRowImageAction(
  imagePrompt: string,
  referenceImageDataUrl?: string
) {
  if (!imagePrompt.trim()) {
    throw new Error("Nothing to generate an image from — add an image prompt first.");
  }
  return generateImageFromPrompt(imagePrompt, { referenceImageDataUrl });
}

export async function pushWeeklyPlanAction(
  posts: Array<WeeklyPlanItem & { scheduledDate?: string; imageDataUrl?: string }>
) {
  if (posts.length === 0) {
    throw new Error("Nothing selected to push to the timeline.");
  }

  await prisma.post.createMany({
    data: posts.map((p) => ({
      theme: p.theme.trim() || "General",
      title: p.title.trim() || "Untitled",
      caption: p.caption.trim() || null,
      imagePrompt: p.imagePrompt.trim() || null,
      scheduledDate: p.scheduledDate ? new Date(p.scheduledDate) : null,
      imageDataUrl: p.imageDataUrl || null,
    })),
  });

  revalidatePath("/timeline");
}
