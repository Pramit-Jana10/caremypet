"use client";

import Link from "next/link";
import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  href?: string;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", asChild, href, ...props },
  ref
) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:cursor-not-allowed disabled:opacity-60",
    {
      primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-soft",
      secondary: "bg-ink-100 text-ink-900 hover:bg-ink-200",
      ghost: "bg-transparent text-ink-800 hover:bg-ink-100",
      danger: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-ink-300 bg-white text-ink-900 hover:bg-ink-50"
    }[variant],
    {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-5 text-base"
    }[size],
    className
  );

  if (asChild && href) {
    // Convenience: render a Next.js Link with button styles.
    // Note: ref is ignored in this mode intentionally.
    return (
      <Link className={classes} href={href as any}>
        {props.children}
      </Link>
    );
  }

  if (asChild) {
    // asChild without href is treated as standard button for simplicity.
  }

  return <button ref={ref} className={classes} {...props} />;
});

