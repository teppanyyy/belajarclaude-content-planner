"use client";

import { useState, useTransition } from "react";
import { toggleDoneAction, deletePostAction } from "@/app/timeline/actions";
import CopyButton from "./CopyButton";

export type PostRowData = {
  id: number;
  theme: string;
  title: string;
  caption: string | null;
  imagePrompt: string | null;
  done: boolean;
  scheduledDate: Date | null;
};

export default function PostRow({ post, index }: { post: PostRowData; index: number }) {
  const [expanded, setExpanded] = useState<"caption" | "imagePrompt" | null>(null);
  const [done, setDone] = useState(post.done);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      await toggleDoneAction(post.id, next);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${post.title}"?`)) return;
    startTransition(async () => {
      await deletePostAction(post.id);
    });
  }

  return (
    <>
      <tr className="border-b border-gray-100 text-sm">
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={done}
            onChange={handleToggle}
            disabled={isPending}
            className="h-4 w-4 rounded accent-accent"
          />
        </td>
        <td className="px-4 py-3 font-medium text-gray-500">{index + 1}</td>
        <td className="px-4 py-3">
          <span className="rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent">
            {post.theme}
          </span>
        </td>
        <td
          className={`px-4 py-3 font-medium ${
            done ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {post.title}
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded(expanded === "caption" ? null : "caption")}
            className="text-accent hover:underline disabled:text-gray-300"
            disabled={!post.caption}
          >
            View Caption
          </button>
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded(expanded === "imagePrompt" ? null : "imagePrompt")}
            className="text-accent hover:underline disabled:text-gray-300"
            disabled={!post.imagePrompt}
          >
            View Prompt
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <CopyButton text={post.caption ?? ""} label="Copy Caption" />
            <CopyButton text={post.imagePrompt ?? ""} label="Copy Prompt" />
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-400 hover:border-red-200 hover:text-red-500"
              title="Delete post"
            >
              ✕
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-100 bg-gray-50 text-sm">
          <td colSpan={7} className="px-4 py-3 whitespace-pre-wrap text-gray-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              {expanded === "caption" ? "Caption" : "Image Prompt"}
            </span>
            {expanded === "caption" ? post.caption : post.imagePrompt}
          </td>
        </tr>
      )}
    </>
  );
}
