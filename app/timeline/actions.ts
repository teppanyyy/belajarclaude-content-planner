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
