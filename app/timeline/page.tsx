import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProgressBar from "@/components/ProgressBar";
import PostRow, { type PostRowData } from "@/components/PostRow";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const posts: PostRowData[] = await prisma.post.findMany({
    orderBy: { createdAt: "asc" },
  });

  const doneCount = posts.filter((p: PostRowData) => p.done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Content Timeline</h1>
          <p className="mt-1 text-sm text-gray-500">
            Everything you've planned, generated, and published — updates live as you add
            posts.
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
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Done</th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Theme</th>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Caption</th>
                <th className="px-4 py-3">Image Prompt</th>
                <th className="px-4 py-3">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <PostRow key={post.id} post={post} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
