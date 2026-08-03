export default function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-gray-700">Publishing progress</span>
        <span className="text-gray-900">
          {done} / {total}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
