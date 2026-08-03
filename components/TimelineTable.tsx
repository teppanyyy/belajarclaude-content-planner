"use client";

import { useMemo, useState } from "react";
import PostRow, { type PostRowData } from "./PostRow";

export default function TimelineTable({ posts }: { posts: PostRowData[] }) {
  const [themeFilter, setThemeFilter] = useState("all");

  const themes = useMemo(
    () => Array.from(new Set(posts.map((p) => p.theme))).sort(),
    [posts]
  );

  const filtered =
    themeFilter === "all" ? posts : posts.filter((p) => p.theme === themeFilter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="theme-filter" className="text-sm font-medium text-gray-600">
          Filter by theme:
        </label>
        <select
          id="theme-filter"
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All themes ({posts.length})</option>
          {themes.map((theme) => (
            <option key={theme} value={theme}>
              {theme} ({posts.filter((p) => p.theme === theme).length})
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No posts match this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Done</th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Theme</th>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Caption</th>
                <th className="px-4 py-3">Image Prompt</th>
                <th className="px-4 py-3">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post, i) => (
                <PostRow key={post.id} post={post} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
