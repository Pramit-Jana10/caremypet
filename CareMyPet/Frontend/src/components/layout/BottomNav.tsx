"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ROUTES } from "@/utils/constants";

type NavItem = {
  href: Route;
  label: string;
  icon: string;
  startsWith?: boolean;
  badge?: number;
};

export function BottomNav() {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: ROUTES.home, label: "Home", icon: "H" },
    { href: ROUTES.library, label: "Library", icon: "L", startsWith: true },
    { href: ROUTES.assistant, label: "Assistant", icon: "A", startsWith: true },
    { href: ROUTES.diary, label: "Diary", icon: "D", startsWith: true },
    { href: ROUTES.profile, label: "Profile", icon: "P", startsWith: true }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 backdrop-blur md:hidden" aria-label="Bottom navigation">
      <div className="mx-auto grid max-w-6xl grid-cols-5">
        {items.map((item) => {
          const isActive = item.startsWith
            ? pathname === item.href || pathname?.startsWith(item.href + "/")
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex flex-col items-center justify-center gap-1 px-1 py-2 text-xs transition",
                isActive ? "text-ink-900" : "text-ink-600 hover:text-ink-900"
              )}
            >
              <span className="text-sm leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className="leading-none">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute right-5 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
