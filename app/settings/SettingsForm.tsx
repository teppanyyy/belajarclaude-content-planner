"use client";

import { useState, useTransition } from "react";
import { saveBrandStyleGuideAction } from "./actions";

export default function SettingsForm({
  initialStyleGuide,
}: {
  initialStyleGuide: string;
}) {
  const [styleGuide, setStyleGuide] = useState(initialStyleGuide);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startSaving(async () => {
      try {
        await saveBrandStyleGuideAction(styleGuide);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          Saved — new posts will use this style guide from now on.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Visual style guide
        </label>
        <textarea
          value={styleGuide}
          onChange={(e) => setStyleGuide(e.target.value)}
          rows={24}
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Style Guide"}
      </button>
    </div>
  );
}
