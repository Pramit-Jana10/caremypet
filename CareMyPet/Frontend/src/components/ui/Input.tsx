"use client";

import clsx from "clsx";
import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  rightAdornment?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, label, error, id, rightAdornment, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className={clsx("w-full", className)}>
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink-800">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "h-11 w-full rounded-xl border bg-white px-3 text-sm text-ink-900 shadow-sm",
            "placeholder:text-ink-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/40",
            rightAdornment ? "pr-11" : null,
            error ? "border-red-400" : "border-ink-200"
          )}
          {...props}
        />
        {rightAdornment ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightAdornment}</div>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});

