import { prisma } from "./prisma";

// Fixed starting set shown in both the New Post and Weekly Plan theme
// dropdowns.
export const DEFAULT_THEMES = [
  "Learn Claude",
  "Prompt Library",
  "Claude for Work",
  "Mistakes & Myths",
  "News & Updates",
];

/**
 * The shared theme list used by both forms: the fixed defaults above, plus
 * any other theme that's actually been used on a saved post. This is what
 * makes a theme added via the "+" control in either form show up in the
 * other — as soon as a post using it is saved (a weekly plan post gets
 * pushed to the timeline, or a new post is saved directly), it becomes a
 * permanent option here.
 */
export async function getThemeOptions(): Promise<string[]> {
  const rows = await prisma.post.findMany({
    select: { theme: true },
    distinct: ["theme"],
  });

  const options = [...DEFAULT_THEMES];
  for (const { theme } of rows) {
    if (theme && !options.some((t) => t.toLowerCase() === theme.toLowerCase())) {
      options.push(theme);
    }
  }
  return options;
}
