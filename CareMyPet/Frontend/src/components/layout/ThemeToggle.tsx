"use client";

import { useTheme } from "@/context/ThemeContext";
import clsx from "clsx";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mounted, resolvedTheme, toggleTheme } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle dark mode"
        className={clsx(
          "inline-flex items-center justify-center rounded-xl border border-ink-200 bg-white/80 text-ink-700",
          compact ? "h-10 w-10" : "h-10 px-3"
        )}
      >
        {compact ? "◐" : "Theme"}
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white/80 text-ink-700 transition hover:bg-ink-100",
        compact ? "h-10 w-10" : "h-10 px-3 text-sm font-medium"
      )}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
      {!compact ? <span>{isDark ? "Light" : "Dark"}</span> : null}
    </button>
  );
}
