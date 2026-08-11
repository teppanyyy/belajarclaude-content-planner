"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateContentAction, createPostAction, generateImageAction } from "./actions";
import type { ImageInput } from "@/lib/anthropic";

const THEME_SUGGESTIONS = [
  "Prompt of the Day",
  "AI untuk Bisnis",
  "Untuk Pemula",
];

type Mode = "generate" | "import";

export default function NewPostForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("generate");
  const [theme, setTheme] = useState("");
  const [topic, setTopic] = useState("");
  const [caption, setCaption] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageInput | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, startGeneratingImage] = useTransition();

  function handleModeChange(next: Mode) {
    setMode(next);
    setError(null);
  }

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
      setImageData({
        mediaType: match[1] as ImageInput["mediaType"],
        base64: match[2],
      });
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
    startGenerating(async () => {
      try {
        const result = await generateContentAction(theme, topic, imageData ?? undefined, notes);
        setCaption(result.caption);
        setImagePrompt(result.imagePrompt);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate content.");
      }
    });
  }

  function handleGenerateImage() {
    setError(null);
    startGeneratingImage(async () => {
      try {
        const url = await generateImageAction(imagePrompt, imagePreview ?? undefined);
        setGeneratedImageUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate image.");
      }
    });
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      try {
        await createPostAction({
          theme,
          title: topic,
          caption,
          imagePrompt,
          scheduledDate,
          imageDataUrl: generatedImageUrl ?? imagePreview ?? undefined,
        });
        router.push("/timeline");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save post.");
      }
    });
  }

  const isImportMode = mode === "import";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add New Content</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isImportMode
            ? "Already have a caption and image prompt from somewhere else? Paste them in and upload the image — no generation needed."
            : "Enter a theme and topic, then generate a caption + image prompt with Claude."}
        </p>
      </div>

      <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1 text-sm">
        <button
          type="button"
          onClick={() => handleModeChange("generate")}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${
            mode === "generate"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Generate with Claude
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("import")}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${
            mode === "import"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          I already have content
        </button>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {isImportMode ? "Post title" : "Topic / idea"}
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Prompt Claude AI untuk Analisis Data"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {!isImportMode && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Additional prompt / notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any extra instructions for Claude — tone, specific points to hit, things to avoid, etc."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {isImportMode ? "Post image" : "Reference image (optional)"}
          </label>
          <p className="mb-2 text-xs text-gray-500">
            {isImportMode
              ? "Upload the final image for this post — it's saved as-is, no AI generation involved."
              : "Attach a photo or screenshot and Claude will look at it while writing the caption."}
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

        {!isImportMode && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !theme.trim() || !topic.trim()}
            className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating with Claude..." : "Generate Caption + Image Prompt"}
          </button>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            placeholder={
              isImportMode
                ? "Paste your ready-made caption here."
                : "Generated caption will appear here — edit freely before saving."
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Image prompt</label>
          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            rows={3}
            placeholder={
              isImportMode
                ? "Paste your ready-made image prompt here."
                : "Generated AI image prompt will appear here."
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {!isImportMode && (
          <div>
            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !imagePrompt.trim()}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeneratingImage ? "Generating image with OpenAI..." : "Generate Image from Prompt"}
            </button>
            <p className="mt-1 text-xs text-gray-400">
              Renders the image prompt above into an actual picture (costs a small amount per
              image via OpenAI). This is what gets saved with the post.
            </p>
            {generatedImageUrl && (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedImageUrl}
                  alt="Generated post image"
                  className="h-32 w-32 rounded-md border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setGeneratedImageUrl(null)}
                  className="text-xs font-medium text-gray-500 hover:text-red-500"
                >
                  Remove generated image
                </button>
              </div>
            )}
          </div>
        )}
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
