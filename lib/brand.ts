import { prisma } from "./prisma";

const SETTINGS_ID = 1;

export const DEFAULT_STYLE_GUIDE = `Create a high-resolution 4:5 Instagram feed post for BelajarClaude, exactly 1080 x 1350 px. Follow a consistent premium editorial educational infographic style.

OVERALL VISUAL STYLE
Use a bright white background with a subtle soft lavender/violet radial glow and thin concentric circular line patterns. Use the following BelajarClaude colour palette: Primary Purple #5B3FC4, Accent Violet #7356D8, Soft Lavender #E9E3FA, Pale Lavender #F5F2FC, Deep Text #27232D, Secondary Text #6E6875, Background #FFFFFF.
Use elegant editorial serif typography similar to DM Serif Display for the main headline, with italic serif emphasis in purple. Use clean modern sans-serif typography similar to Inter for body text, labels, prompts, badges, and footer text. Use generous whitespace and strong visual hierarchy. Use rounded white content cards with approximately 28px corner radius and extremely subtle soft shadows. Use minimalist purple line icons with approximately 1.5-2px rounded strokes. Keep the overall design friendly, practical, modern, educational, premium but approachable, and not overly corporate. Do not introduce unrelated colours, fonts, corporate design elements, dark backgrounds, excessive gradients, realistic stock photography, or cluttered layouts.

FIXED BRAND ELEMENTS - MUST REMAIN CONSISTENT IN EVERY POST
1. BelajarClaude logo top left, ~55-60px from the left edge, ~45-55px from the top edge, visual width ~150-180px, visual height ~30-40px. Subtle and elegant, should not compete with the main headline. Preserve the official logo's proportions; do not redesign, distort, stretch, replace, or reinterpret it. Logo colour is Primary Purple #5B3FC4.
2. Fixed footer at the bottom of every post: "Belajar Claude AI secara praktis bahasa Indonesia untuk semua level." as a centred two-line statement, clean sans-serif similar to Inter, weight ~400, ~18-20px, colour #6E6875, line height ~24-26px, centre aligned, ~50-60px from the bottom edge with generous whitespace above it. Below the footer, three small rounded pill badges in one horizontal row, centred: "Bahasa Indonesia", "Untuk semua level", "Langsung praktik" - Inter Regular/Medium ~16-18px, text colour #6B46C1, background #F5F2FC, pill corner radius ~20-24px, horizontal padding ~18-24px, vertical padding ~8-12px. Do not add another large logo in the footer.

LAYOUT & DIMENSIONS
Exact 4:5 canvas, 1080 x 1350px - not taller, narrower, square, or a different layout. Generous margins; keep important content at least 50px from the canvas edge. The logo and footer are fixed and must keep the same position, scale, and treatment in every post. Only the main educational content between the logo and footer changes per topic.

TEXT & CONTENT
Keep all text minimal, crisp, sharp, correctly spelled, and highly legible. Do not add unnecessary text or invent additional headlines, descriptions, statistics, or information beyond what's provided. Maintain clear visual hierarchy: brand logo, category label, main headline, short supporting text, main educational visual/content card, practical takeaway/tip, fixed footer.

BRAND IDENTITY
Practical, friendly, editorial, minimal, educational, modern, approachable, premium but accessible, not overly corporate. Maintain this visual system consistently across all posts.`;

export async function getBrandStyleGuide(): Promise<string> {
  const settings = await prisma.brandSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  return settings?.styleGuide ?? DEFAULT_STYLE_GUIDE;
}

export async function saveBrandStyleGuide(styleGuide: string): Promise<void> {
  await prisma.brandSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, styleGuide },
    update: { styleGuide },
  });
}
