import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProgressBar from "@/components/ProgressBar";
import TimelineTable from "@/components/TimelineTable";
import type { PostRowData } from "@/components/PostRow";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const posts: PostRowData[] = await prisma.post.findMany({
    // Posts with a scheduled date come first (soonest next), posts without
    // one fall to the end in the order they were created.
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
  });

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
