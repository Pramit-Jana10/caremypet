"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { APP_NAME, ROUTES } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useVaccinationAlerts } from "@/hooks/useVaccinationAlerts";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const VACCINE_TOOLTIP_SEEN_KEY = "spc_vaccine_bell_tooltip_seen";

const navLinks = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.shop, label: "Shop" },
  { href: ROUTES.vets, label: "Vets" },
  { href: ROUTES.vaccinations, label: "Vaccinations" },
  { href: ROUTES.medicines, label: "Medicines" },
  { href: ROUTES.contact, label: "Contact Us" },
  { href: ROUTES.dashboard, label: "Dashboard" }
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { token, user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const isAuthed = !!token;
  const vaccinationAlerts = useVaccinationAlerts(isAuthed);
  const [showVaccineTooltip, setShowVaccineTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const vaccinationAlertHref = useMemo(() => {
    const target = vaccinationAlerts.priorityAlert;
    if (!target) return ROUTES.vaccinations;

    const query = new URLSearchParams({
      petId: target.petId,
      focusVaccineId: target.vaccineId,
    });
    return `${ROUTES.vaccinations}?${query.toString()}`;
  }, [vaccinationAlerts.priorityAlert]);
  const activeHref = useMemo(() => {
    const found = navLinks.find((l) => l.href !== "/" && pathname?.startsWith(l.href));
    return found?.href || (pathname === "/" ? "/" : "");
  }, [pathname]);

  useEffect(() => {
    if (!isAuthed) {
      setShowVaccineTooltip(false);
      return;
    }

    if (!vaccinationAlerts.shouldPulse || !vaccinationAlerts.hasAlerts) {
      return;
    }

    const alreadySeen = localStorage.getItem(VACCINE_TOOLTIP_SEEN_KEY) === "1";
    if (alreadySeen) {
      return;
    }

    setShowVaccineTooltip(true);
    localStorage.setItem(VACCINE_TOOLTIP_SEEN_KEY, "1");

    if (tooltipTimeoutRef.current !== null) {
      window.clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = window.setTimeout(() => {
      setShowVaccineTooltip(false);
      tooltipTimeoutRef.current = null;
    }, 4500);
  }, [isAuthed, vaccinationAlerts.hasAlerts, vaccinationAlerts.shouldPulse]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current !== null) {
        window.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="inline-flex h-9 w-9 rounded-xl bg-white bg-[url('/brand/logo.png')] bg-cover bg-center shadow-soft"
              aria-hidden="true"
            />
            <span className="hidden text-sm font-semibold text-ink-900 sm:block">{APP_NAME}</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                activeHref === l.href ? "bg-ink-100 text-ink-900" : "text-ink-700 hover:bg-ink-50"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {l.label}
                {l.href === ROUTES.vaccinations && vaccinationAlerts.hasAlerts ? (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                      vaccinationAlerts.hasOverdue ? "bg-red-600 text-white" : "bg-amber-500 text-white",
                      vaccinationAlerts.shouldPulse && "animate-bounce"
                    )}
                  >
                    <span>!</span>
                    <span>{vaccinationAlerts.dueTodayOrOverdueCount}</span>
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />

          <Link
            href={ROUTES.cart}
            className="relative rounded-xl px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Cart
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white">
                {count}
              </span>
            ) : null}
          </Link>

          {isAuthed && vaccinationAlerts.hasAlerts ? (
            <div className="relative">
              <Link
                href={vaccinationAlertHref as any}
                className={clsx(
                  "inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold",
                  vaccinationAlerts.hasOverdue
                    ? "bg-red-100 text-red-900 hover:bg-red-200"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200",
                  vaccinationAlerts.shouldPulse && "animate-pulse"
                )}
              >
                Bell {vaccinationAlerts.dueTodayOrOverdueCount}
              </Link>

              {showVaccineTooltip ? (
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[11px] font-medium text-ink-700 shadow-soft">
                  New vaccine alert. Check Vaccinations.
                </div>
              ) : null}
            </div>
          ) : null}

          {isAuthed ? (
            <>
              {user?.role === "admin" ? (
                <Button asChild variant="secondary" className="hidden md:inline-flex" href={ROUTES.admin}>
                  Admin panel
                </Button>
              ) : null}
              <Link
                href={ROUTES.profile}
                className="hidden rounded-xl px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50 md:inline-flex"
              >
                {user?.name ? `Hi, ${user.name.split(" ")[0]}` : "Profile"}
              </Link>
              <Button variant="ghost" onClick={logout} className="hidden md:inline-flex">
                Logout
              </Button>
            </>
          ) : (
            <div className="hidden md:flex md:items-center md:gap-2">
              <Button asChild variant="ghost" href={ROUTES.login}>
                Login
              </Button>
              <Button asChild href={ROUTES.register}>
                Register
              </Button>
            </div>
          )}

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-ink-50 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-xl">{open ? "×" : "≡"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-ink-100 bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex flex-col gap-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "rounded-xl px-3 py-2 text-sm font-medium transition",
                    activeHref === l.href ? "bg-ink-100 text-ink-900" : "text-ink-700 hover:bg-ink-50"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {l.label}
                    {l.href === ROUTES.vaccinations && vaccinationAlerts.hasAlerts ? (
                      <span
                        className={clsx(
                          "inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                          vaccinationAlerts.hasOverdue ? "bg-red-600 text-white" : "bg-amber-500 text-white",
                          vaccinationAlerts.shouldPulse && "animate-bounce"
                        )}
                      >
                        {vaccinationAlerts.dueTodayOrOverdueCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}

              <div className="mt-2 flex gap-2">
                <ThemeToggle />
                {isAuthed ? (
                  <>
                    {user?.role === "admin" ? (
                      <Button asChild variant="secondary" className="flex-1" href={ROUTES.admin}>
                        Admin panel
                      </Button>
                    ) : null}
                    <Button asChild variant="secondary" className="flex-1" href={ROUTES.profile}>
                      Profile
                    </Button>
                    <Button variant="ghost" className="flex-1" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="flex-1" href={ROUTES.login}>
                      Login
                    </Button>
                    <Button asChild className="flex-1" href={ROUTES.register}>
                      Register
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

