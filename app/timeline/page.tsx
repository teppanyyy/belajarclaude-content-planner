import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProgressBar from "@/components/ProgressBar";
import TimelineTable from "@/components/TimelineTable";
import type { PostRowData } from "@/components/PostRow";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  // Deliberately does NOT select imageDataUrl — those are base64-encoded
  // images that can be a megabyte-plus each, and loading every one of them
  // on every page view (for a tiny 48px thumbnail) is what was making this
  // page slow. hasImage is a cheap boolean computed in SQL; the actual
  // image bytes are fetched lazily per-row via /api/posts/[id]/image only
  // when that row's thumbnail is actually rendered.
  //
  // Posts with a scheduled date come first (soonest next), posts without
  // one fall to the end in the order they were created — Postgres's
  // default ASC ordering already puts NULLs last, matching the previous
  // Prisma orderBy behavior.
  const posts: PostRowData[] = await prisma.$queryRaw<PostRowData[]>`
    SELECT
      "id",
      "theme",
      "title",
      "caption",
      "imagePrompt",
      "done",
      "scheduledDate",
      ("imageDataUrl" IS NOT NULL) AS "hasImage"
    FROM "Post"
    ORDER BY "scheduledDate" ASC, "createdAt" ASC
  `;

  const doneCount = posts.filter((p: PostRowData) => p.done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Content Timeline</h1>
          <p className="mt-1 text-sm text-gray-500">
            Everything you've planned, generated, and published — sorted by scheduled date,
            updates live as you add posts.
          </p>
        </div>
        <div className="w-64 shrink-0">
          <ProgressBar done={doneCount} total={posts.length} />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">No posts yet.</p>
          <Link
            href="/new"
            className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add your first post
          </Link>
        </div>
      ) : (
        <TimelineTable posts={posts} />
      )}
    </div>
  );
}
