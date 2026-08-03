"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateContentAction, createPostAction } from "./actions";

const THEME_SUGGESTIONS = [
  "Prompt of the Day",
  "AI untuk Bisnis",
  "Untuk Pemula",
];

export default function NewPostForm() {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [topic, setTopic] = useState("");
  const [caption, setCaption] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function handleGenerate() {
    setError(null);
    startGenerating(async () => {
      try {
        const result = await generateContentAction(theme, topic);
        setCaption(result.caption);
        setImagePrompt(result.imagePrompt);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate content.");
      }
    });
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      try {
        await createPostAction({ theme, title: topic, caption, imagePrompt, scheduledDate });
        router.push("/timeline");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save post.");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add New Content</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter a theme and topic, then generate a caption + image prompt with Claude.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Theme</label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Prompt of the Day"
            list="theme-suggestions"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <datalist id="theme-suggestions">
            {THEME_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Topic / idea</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Prompt Claude AI untuk Analisis Data"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Scheduled date (optional)
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !theme.trim() || !topic.trim()}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Generating with Claude..." : "Generate Caption + Image Prompt"}
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            placeholder="Generated caption will appear here — edit freely before saving."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Image prompt</label>
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            rows={3}
            placeholder="Generated AI image prompt will appear here."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !theme.trim() || !topic.trim()}
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save to Planner"}
      </button>
    </div>
  );
}
