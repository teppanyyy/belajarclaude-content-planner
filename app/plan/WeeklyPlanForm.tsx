"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateWeeklyPlanAction,
  pushWeeklyPlanAction,
  generateRowImageAction,
} from "./actions";
import type { ImageInput, WeeklyPlanItem } from "@/lib/anthropic";

const DEFAULT_THEMES = [
  "🟣 Prompt of the Day",
  "💼 AI untuk Bisnis",
  "🧠 Untuk Pemula",
  "💡 AI Tips",
  "🎓 BelajarClaude Promotion",
].join("\n");

const DEFAULT_AUDIENCE =
  "Small business owners, beginners, freelancers, students, and people who are not very tech-savvy and new to learning AI, based in Indonesia.";

type PlanRow = WeeklyPlanItem & {
  include: boolean;
  scheduledDate: string;
  imageDataUrl?: string;
};

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function WeeklyPlanForm() {
  const router = useRouter();

  // Setup form state
  const [count, setCount] = useState(10);
  const [themesText, setThemesText] = useState(DEFAULT_THEMES);
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageInput | null>(null);

  // Review/edit state
  const [rows, setRows] = useState<PlanRow[] | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [generatingImageRows, setGeneratingImageRows] = useState<Set<number>>(new Set());

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("That image is too large — please use one under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.*)$/);
      if (!match) {
        setError("Unsupported image type — please use JPG, PNG, GIF, or WEBP.");
        return;
      }
      setImageData({ mediaType: match[1] as ImageInput["mediaType"], base64: match[2] });
      setImagePreview(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageData(null);
    setImagePreview(null);
  }

  function handleGenerate() {
    setError(null);
    const themes = themesText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    startGenerating(async () => {
      try {
        const items = await generateWeeklyPlanAction({
          count,
          themes,
          audience,
          notes,
          image: imageData ?? undefined,
        });
        const newRows: PlanRow[] = items.map((item, i) => ({
          ...item,
          include: true,
          scheduledDate: startDate ? addDays(startDate, i) : "",
        }));
        setRows(newRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate plan.");
      }
    });
  }

  function updateRow(index: number, patch: Partial<PlanRow>) {
    setRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function handleGenerateRowImage(index: number) {
    const row = rows?.[index];
    if (!row || !row.imagePrompt.trim()) return;

    setError(null);
    setGeneratingImageRows((prev) => new Set(prev).add(index));

    generateRowImageAction(row.imagePrompt, imagePreview ?? undefined)
      .then((url) => {
        updateRow(index, { imageDataUrl: url });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to generate image.");
      })
      .finally(() => {
        setGeneratingImageRows((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      });
  }

  function handlePush() {
    if (!rows) return;
    setError(null);
    const selected = rows.filter((r) => r.include);
    if (selected.length === 0) {
      setError("Select at least one post to push to the timeline.");
      return;
    }

    startSaving(async () => {
      try {
        await pushWeeklyPlanAction(
          selected.map(({ include, ...rest }) => rest)
        );
        router.push("/timeline");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to push to timeline.");
      }
    });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Weekly Content Plan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate a batch of posts in one shot, review and edit them, then push the
          ones you want straight to the timeline.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Number of posts
            </label>
            <input
              type="number"
              min={1}
              max={21}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Starting date (optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-xs text-gray-400">
              If set, posts are dated one per day starting here (editable after generating).
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Themes to rotate through (one per line)
          </label>
          <textarea
            value={themesText}
            onChange={(e) => setThemesText(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Target audience
          </label>
          <textarea
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Additional notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. specific topics to cover this batch, things to avoid..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Reference image (optional, strongly recommended)
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Attach an already-designed post and Claude will lock every image prompt in
            this batch to that same visual style.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-accent-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent hover:file:opacity-90"
          />
          {imagePreview && (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Selected reference"
                className="h-20 w-20 rounded-md border border-gray-200 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs font-medium text-gray-500 hover:text-red-500"
              >
                Remove image
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Generating batch with Claude... this can take a minute" : "Generate Weekly Plan"}
        </button>
      </div>

      {rows && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[1400px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">Include</th>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Image</th>
                  <th className="px-3 py-3">Theme</th>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 min-w-[260px]">Caption</th>
                  <th className="px-3 py-3 min-w-[260px]">Image Prompt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 align-top">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => updateRow(i, { include: e.target.checked })}
                        className="h-4 w-4 rounded accent-accent"
                      />
                    </td>
                    <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex w-24 flex-col items-start gap-1.5">
                        {row.imageDataUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={row.imageDataUrl}
                              alt={`Generated image for ${row.title}`}
                              className="h-20 w-20 rounded-md border border-gray-200 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleGenerateRowImage(i)}
                              disabled={generatingImageRows.has(i) || !row.imagePrompt.trim()}
                              className="text-[11px] font-medium text-gray-500 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {generatingImageRows.has(i) ? "Regenerating..." : "Regenerate"}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGenerateRowImage(i)}
                            disabled={generatingImageRows.has(i) || !row.imagePrompt.trim()}
                            className="rounded-md bg-gray-900 px-2 py-1.5 text-[11px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {generatingImageRows.has(i) ? "Generating..." : "Generate Image"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={row.theme}
                        onChange={(e) => updateRow(i, { theme: e.target.value })}
                        className="w-32 rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={row.title}
                        onChange={(e) => updateRow(i, { title: e.target.value })}
                        className="w-40 rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={row.scheduledDate}
                        onChange={(e) => updateRow(i, { scheduledDate: e.target.value })}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <textarea
                        value={row.caption}
                        onChange={(e) => updateRow(i, { caption: e.target.value })}
                        rows={4}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <textarea
                        value={row.imagePrompt}
                        onChange={(e) => updateRow(i, { imagePrompt: e.target.value })}
                        rows={4}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handlePush}
            disabled={isSaving}
            className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Pushing to timeline..."
              : `Push ${rows.filter((r) => r.include).length} Selected Post${
                  rows.filter((r) => r.include).length === 1 ? "" : "s"
                } to Timeline`}
          </button>
        </div>
      )}
    </div>
  );
}
