"use client";

import { useEffect } from "react";
import clsx from "clsx";

export function Modal({
  open,
  title,
  children,
  onClose,
  className
}: {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className={clsx("relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft", className)}>
        {title ? <h2 className="text-lg font-semibold text-ink-900">{title}</h2> : null}
        <div className={title ? "mt-4" : ""}>{children}</div>
      </div>
    </div>
  );
}

