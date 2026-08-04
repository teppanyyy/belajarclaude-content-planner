"use client";

import { useState, useTransition } from "react";
import { toggleDoneAction, deletePostAction, updatePostImageAction } from "@/app/timeline/actions";
import CopyButton from "./CopyButton";

export type PostRowData = {
  id: number;
  theme: string;
  title: string;
  caption: string | null;
  imagePrompt: string | null;
  imageDataUrl: string | null;
  done: boolean;
  scheduledDate: Date | null;
};

function getImageExtension(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/([a-zA-Z]+);/);
  const ext = match ? match[1] : "jpg";
  return ext === "jpeg" ? "jpg" : ext;
}

function formatScheduledDate(date: Date | null) {
  if (!date) return "Not scheduled";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PostRow({ post, index }: { post: PostRowData; index: number }) {
  const [done, setDone] = useState(post.done);
  const [imageDataUrl, setImageDataUrl] = useState(post.imageDataUrl);
  const [imageError, setImageError] = useState<string | null>(null);
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

  function handleImportImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setImageError("That image is too large — please use one under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!/^data:image\/(jpeg|png|gif|webp);base64,/.test(dataUrl)) {
        setImageError("Unsupported image type — please use JPG, PNG, GIF, or WEBP.");
        return;
      }
      setImageError(null);
      setImageDataUrl(dataUrl);
      startTransition(async () => {
        await updatePostImageAction(post.id, dataUrl);
      });
    };
    reader.readAsDataURL(file);
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
          {imageDataUrl ? (
            <a href={imageDataUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt={post.title}
                className="h-12 w-12 rounded-md border border-gray-200 object-cover hover:opacity-80"
              />
            </a>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>
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
        <td className="px-4 py-3 text-gray-600">
          {formatScheduledDate(post.scheduledDate)}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={post.caption ?? ""} label="Copy Caption" />
            <CopyButton text={post.imagePrompt ?? ""} label="Copy Prompt" />
            <label
              htmlFor={`import-image-${post.id}`}
              className="w-32 cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {imageDataUrl ? "Replace Image" : "Import Image"}
            </label>
            <input
              id={`import-image-${post.id}`}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImportImage}
              className="hidden"
            />
            {imageDataUrl ? (
              <a
                href={imageDataUrl}
                download={`post-${post.id}.${getImageExtension(imageDataUrl)}`}
                className="w-32 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Download Image
              </a>
            ) : (
              <span className="w-32 rounded-md border border-gray-100 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-300">
                Download Image
              </span>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-400 hover:border-red-200 hover:text-red-500"
              title="Delete post"
            >
              ✕
            </button>
          </div>
          {imageError && <p className="mt-1 text-xs text-red-500">{imageError}</p>}
        </td>
      </tr>
    </>
  );
}
