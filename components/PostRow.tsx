"use client";

import { useState, useTransition } from "react";
import {
  toggleDoneAction,
  deletePostAction,
  updatePostImageAction,
  updatePostDateAction,
  updatePostThemeAction,
  updatePostContentAction,
} from "@/app/timeline/actions";
import CopyButton from "./CopyButton";

export type PostRowData = {
  id: number;
  theme: string;
  title: string;
  caption: string | null;
  imagePrompt: string | null;
  hasImage: boolean;
  done: boolean;
  scheduledDate: Date | null;
};

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default function PostRow({ post, index }: { post: PostRowData; index: number }) {
  const [done, setDone] = useState(post.done);
  // Only holds a value once the user imports/replaces an image *this
  // session* (so the new image shows immediately without a reload). For
  // everything else, the thumbnail/preview/download just point at the
  // /api/posts/[id]/image route, which is fetched lazily by the browser.
  const [freshImageDataUrl, setFreshImageDataUrl] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(post.hasImage);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(toDateInputValue(post.scheduledDate));
  const [theme, setTheme] = useState(post.theme);
  const [panel, setPanel] = useState<"closed" | "view" | "edit">("closed");
  const [caption, setCaption] = useState(post.caption ?? "");
  const [imagePrompt, setImagePrompt] = useState(post.imagePrompt ?? "");
  const [isPending, startTransition] = useTransition();

  const imageSrc = freshImageDataUrl ?? (hasImage ? `/api/posts/${post.id}/image` : null);
  const downloadHref = freshImageDataUrl ?? (hasImage ? `/api/posts/${post.id}/image?download` : null);

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
      setFreshImageDataUrl(dataUrl);
      setHasImage(true);
      startTransition(async () => {
        await updatePostImageAction(post.id, dataUrl);
      });
    };
    reader.readAsDataURL(file);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setScheduledDate(next);
    startTransition(async () => {
      await updatePostDateAction(post.id, next);
    });
  }

  function handleThemeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTheme(e.target.value);
  }

  function commitThemeChange() {
    const trimmed = theme.trim();
    if (!trimmed) {
      setTheme(post.theme);
      return;
    }
    if (trimmed === post.theme) {
      setTheme(trimmed);
      return;
    }
    setTheme(trimmed);
    startTransition(async () => {
      await updatePostThemeAction(post.id, trimmed);
    });
  }

  function handleThemeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setTheme(post.theme);
      e.currentTarget.blur();
    }
  }

  function handleSaveContent() {
    startTransition(async () => {
      await updatePostContentAction(post.id, { caption, imagePrompt });
    });
    setPanel("view");
  }

  function handleCancelEdit() {
    setCaption(post.caption ?? "");
    setImagePrompt(post.imagePrompt ?? "");
    setPanel("view");
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
          {imageSrc ? (
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="block"
              title="Click to preview"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={post.title}
                loading="lazy"
                className="h-12 w-12 rounded-md border border-gray-200 object-cover hover:opacity-80"
              />
            </button>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={theme}
            onChange={handleThemeChange}
            onBlur={commitThemeChange}
            onKeyDown={handleThemeKeyDown}
            disabled={isPending}
            aria-label="Theme"
            className="w-full min-w-[8rem] rounded-full border border-transparent bg-accent-light px-3 py-1 text-xs font-medium text-accent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </td>
        <td
          className={`px-4 py-3 font-medium ${
            done ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {post.title}
        </td>
        <td className="px-4 py-3">
          <input
            type="date"
            value={scheduledDate}
            onChange={handleDateChange}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={caption} label="Copy Caption" />
            <CopyButton text={imagePrompt} label="Copy Prompt" />
            <button
              type="button"
              onClick={() => setPanel((prev) => (prev === "closed" ? "view" : "closed"))}
              className="w-32 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {panel === "closed" ? "View Text" : "Close"}
            </button>
            <label
              htmlFor={`import-image-${post.id}`}
              className="w-32 cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {imageSrc ? "Replace Image" : "Import Image"}
            </label>
            <input
              id={`import-image-${post.id}`}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImportImage}
              className="hidden"
            />
            {downloadHref ? (
              <a
                href={downloadHref}
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

      {panel !== "closed" && (
        <tr className="border-b border-gray-100 bg-gray-50 text-sm">
          <td colSpan={7} className="px-4 py-4">
            {panel === "view" ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Caption
                    </label>
                    <p className="whitespace-pre-wrap rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                      {caption || <span className="text-gray-300">No caption yet.</span>}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Image Prompt
                    </label>
                    <p className="whitespace-pre-wrap rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                      {imagePrompt || <span className="text-gray-300">No image prompt yet.</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPanel("edit")}
                    className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel("closed")}
                    className="rounded-md border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Caption
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={5}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Image Prompt
                    </label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      rows={5}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveContent}
                    className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-md border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </td>
        </tr>
      )}

      {showPreview && imageSrc && (
        <tr>
          <td colSpan={7} className="p-0">
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8"
              onClick={() => setShowPreview(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={post.title}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
              >
                ✕ Close
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
