"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleDoneAction(id: number, done: boolean) {
  await prisma.post.update({
    where: { id },
    data: { done },
  });
  revalidatePath("/timeline");
}

export async function deletePostAction(id: number) {
  await prisma.post.delete({ where: { id } });
  revalidatePath("/timeline");
}

export async function updatePostImageAction(id: number, imageDataUrl: string) {
  if (!imageDataUrl.trim()) {
    throw new Error("No image data received.");
  }
  await prisma.post.update({
    where: { id },
    data: { imageDataUrl },
  });
  revalidatePath("/timeline");
}

export async function updatePostDateAction(id: number, scheduledDate: string) {
  await prisma.post.update({
    where: { id },
    data: { scheduledDate: scheduledDate ? new Date(scheduledDate) : null },
  });
  revalidatePath("/timeline");
}

export async function updatePostContentAction(
  id: number,
  data: { caption: string; imagePrompt: string }
) {
  await prisma.post.update({
    where: { id },
    data: {
      caption: data.caption.trim() || null,
      imagePrompt: data.imagePrompt.trim() || null,
    },
  });
  revalidatePath("/timeline");
}
