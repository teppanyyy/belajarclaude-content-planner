"use client";

import { useEffect, useRef, useState } from "react";

export default function ThemeMultiSelect({
  options,
  selected,
  onToggle,
  onAddOption,
}: {
  options: string[];
  selected: string[];
  onToggle: (theme: string) => void;
  onAddOption: (theme: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newTheme, setNewTheme] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleAdd() {
    const trimmed = newTheme.trim();
    if (!trimmed) return;
    if (!options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      onAddOption(trimmed);
    } else if (!selected.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onToggle(trimmed);
    }
    setNewTheme("");
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-left text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400">Select themes...</span>
        ) : (
          selected.map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent"
            >
              {theme}
            </span>
          ))
        )}
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {options.map((theme) => (
              <li key={theme}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.includes(theme)}
                    onChange={() => onToggle(theme)}
                    className="h-4 w-4 rounded accent-accent"
                  />
                  {theme}
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-1.5 border-t border-gray-100 pt-2">
            <input
              type="text"
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Add a theme..."
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTheme.trim()}
              title="Add theme"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-base font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
