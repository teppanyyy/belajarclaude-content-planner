"use server";

import { saveBrandStyleGuide } from "@/lib/brand";

export async function saveBrandStyleGuideAction(styleGuide: string) {
  if (!styleGuide.trim()) {
    throw new Error("Style guide can't be empty.");
  }
  await saveBrandStyleGuide(styleGuide.trim());
}
