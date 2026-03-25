"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ROUTES } from "@/utils/constants";
import { useVaccinationAlerts } from "@/hooks/useVaccinationAlerts";

const links = [
  { href: ROUTES.dashboard, label: "Overview" },
  { href: ROUTES.profile, label: "Profile" },
  { href: ROUTES.vaccinations, label: "Vaccinations" },
  { href: ROUTES.vets, label: "Vets" },
  { href: ROUTES.shop, label: "Orders" },
  { href: ROUTES.admin, label: "Admin" }
];

export function Sidebar() {
  const pathname = usePathname();
  const vaccinationAlerts = useVaccinationAlerts(true);
  const vaccinationAlertHref = (() => {
    const target = vaccinationAlerts.priorityAlert;
    if (!target) return ROUTES.vaccinations;

    const query = new URLSearchParams({
      petId: target.petId,
      focusVaccineId: target.vaccineId,
    });
    return `${ROUTES.vaccinations}?${query.toString()}`;
  })();
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="rounded-2xl bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-ink-900">Dashboard</p>
        <nav className="mt-3 flex flex-col gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            const href = l.href === ROUTES.vaccinations ? vaccinationAlertHref : l.href;
            return (
              <Link
                key={l.href}
                href={href as any}
                className={clsx(
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "bg-ink-100 text-ink-900" : "text-ink-700 hover:bg-ink-50"
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
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

