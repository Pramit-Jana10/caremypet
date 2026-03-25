"use client";

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-ink-700">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

