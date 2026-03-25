"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/utils/constants";
import Link from "next/link";
import { vaccineService } from "@/services/vaccineService";
import { orderService } from "@/services/orderService";

type ProfileSummary = {
  petCount: number;
  orderCount: number;
  pendingVaccinations: number;
  completedVaccinations: number;
};

const EMPTY_SUMMARY: ProfileSummary = {
  petCount: 0,
  orderCount: 0,
  pendingVaccinations: 0,
  completedVaccinations: 0,
};

function getInitials(name: string | undefined) {
  const source = (name || "Pet Parent").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "PP";
}

function formatPlan(plan: string | undefined) {
  if (!plan) return "Free plan";
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-[1.5rem] border border-ink-200/60 bg-ink-50 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:bg-ink-100">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-ink-600">{caption}</p>
    </div>
  );
}

function QuickLinkCard({
  href,
  eyebrow,
  title,
  description,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href as any}
      className="group rounded-[1.5rem] border border-ink-100 bg-white p-5 shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] dark:border-ink-200 dark:bg-ink-100"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700">{eyebrow}</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p>
        </div>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700 transition group-hover:bg-brand-100 group-hover:text-brand-800">
          Open
        </span>
      </div>
    </Link>
  );
}

function ProfileInner() {
  const { user, refreshMe, logout } = useAuth();
  const [summary, setSummary] = useState<ProfileSummary>(EMPTY_SUMMARY);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    let isActive = true;

    (async () => {
      setLoadingSummary(true);
      try {
        await refreshMe();
        const [pets, orders] = await Promise.all([
          vaccineService.listPets().catch(() => []),
          orderService.listMyOrders().catch(() => []),
        ]);

        const schedules = await Promise.all(
          pets.map((pet) => vaccineService.listSchedule(pet.id).catch(() => []))
        );

        const flattenedSchedules = schedules.flat();
        if (!isActive) return;

        setSummary({
          petCount: pets.length,
          orderCount: orders.length,
          pendingVaccinations: flattenedSchedules.filter((item) => item.status === "Pending").length,
          completedVaccinations: flattenedSchedules.filter((item) => item.status === "Done").length,
        });
      } finally {
        if (isActive) {
          setLoadingSummary(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [refreshMe]);

  const initials = getInitials(user?.name);
  const subscription = user?.subscription;
  const membershipTone = subscription?.isPremium
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
  const memberSince = subscription?.premiumSince
    ? new Date(subscription.premiumSince).toLocaleDateString()
    : "Today";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#10213d_0%,#1a355e_52%,#314e79_100%)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.20)] md:px-8 md:py-10">
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-brand-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Account center</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/20 bg-white/10 text-xl font-semibold backdrop-blur">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{user?.name || "Your profile"}</h1>
                <p className="mt-1 text-sm text-white/75">{user?.email || "Manage your account, pets, and care routines."}</p>
              </div>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/80 md:text-base">
              Keep your account details, care history, and pet routines organized in one place with a cleaner overview of what matters most.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Button
              asChild
              href={ROUTES.dashboard}
              className="!bg-white !text-ink-900 hover:!bg-ink-100 dark:!bg-ink-200 dark:!text-ink-900 dark:hover:!bg-ink-300"
            >
              Open dashboard
            </Button>
            <Button variant="ghost" onClick={logout} className="border border-white/20 bg-white/10 text-white hover:bg-white/15">
              Logout
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-500">Identity</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink-900">Account details</h2>
                <p className="mt-2 text-sm leading-6 text-ink-600">
                  This is the profile information currently linked to your CareMyPet account.
                </p>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${membershipTone}`}>
                {subscription?.isPremium ? "Premium member" : "Standard member"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-200 dark:bg-ink-200/50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Full name</p>
                <p className="mt-2 text-base font-semibold text-ink-900">{user?.name || "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-200 dark:bg-ink-200/50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Email</p>
                <p className="mt-2 break-all text-base font-semibold text-ink-900">{user?.email || "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-200 dark:bg-ink-200/50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Role</p>
                <p className="mt-2 text-base font-semibold capitalize text-ink-900">{user?.role ?? "user"}</p>
              </div>
              <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-200 dark:bg-ink-200/50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Membership</p>
                <p className="mt-2 text-base font-semibold text-ink-900">{formatPlan(subscription?.plan)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Pets"
              value={loadingSummary ? "..." : String(summary.petCount)}
              caption="Profiles under your care"
            />
            <StatCard
              label="Orders"
              value={loadingSummary ? "..." : String(summary.orderCount)}
              caption="Purchases tracked here"
            />
            <StatCard
              label="Pending"
              value={loadingSummary ? "..." : String(summary.pendingVaccinations)}
              caption="Vaccines still scheduled"
            />
            <StatCard
              label="Completed"
              value={loadingSummary ? "..." : String(summary.completedVaccinations)}
              caption="Vaccines already done"
            />
          </div>

          <div className="rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-500">Shortcuts</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink-900">Quick actions</h2>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                Built for everyday use
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <QuickLinkCard
                href={ROUTES.dashboard}
                eyebrow="Overview"
                title="Go to dashboard"
                description="Review reminders, upcoming care tasks, and your latest account activity in one snapshot."
              />
              <QuickLinkCard
                href={ROUTES.vaccinations}
                eyebrow="Health"
                title="Manage vaccinations"
                description="Track scheduled and completed vaccines across all pet profiles without losing context."
              />
              <QuickLinkCard
                href={ROUTES.vets}
                eyebrow="Support"
                title="Find trusted vets"
                description="Jump into the vet directory when you need checkups, consultations, or emergency help."
              />
              <QuickLinkCard
                href={ROUTES.shop}
                eyebrow="Shopping"
                title="Browse essentials"
                description="Open the shop to restock food, medicine, and everyday care supplies for your pets."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-500">Membership</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink-900">Plan and access</h2>
            <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(160deg,#f0f4fb_0%,#eef2fa_55%,#e8f0f9_100%)] p-5 dark:bg-[linear-gradient(160deg,#141e33_0%,#18284a_60%,#1e3058_100%)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{formatPlan(subscription?.plan)}</p>
                  <p className="mt-1 text-sm text-ink-600">
                    {subscription?.isPremium
                      ? "Premium tools are active on this account."
                      : "You are currently using the standard CareMyPet experience."}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${membershipTone}`}>
                  {subscription?.isPremium ? "Active" : "Free tier"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-200/50">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Member since</p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">{memberSince}</p>
                </div>
                <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-200/50">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Expires on</p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {subscription?.premiumExpiresOn
                      ? new Date(subscription.premiumExpiresOn).toLocaleDateString()
                      : "No expiry set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(subscription?.premiumFeatures?.length
                ? subscription.premiumFeatures
                : [
                    "Order history and account access",
                    "Vaccination tracking tools",
                    "Vet discovery and care planning",
                  ]).map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-2xl bg-ink-50 px-4 py-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                    ✓
                  </span>
                  <p className="text-sm leading-6 text-ink-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-500">Account health</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink-900">What looks good</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-900">Profile ready</p>
                <p className="mt-1 text-sm text-emerald-800">Your account details are available and ready to use across the app.</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                <p className="text-sm font-semibold text-sky-900">Care snapshot synced</p>
                <p className="mt-1 text-sm text-sky-800">Pets, orders, and vaccination totals are pulled into this page for a faster overview.</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-900">Next best step</p>
                <p className="mt-1 text-sm text-amber-800">
                  {summary.pendingVaccinations > 0
                    ? `You have ${summary.pendingVaccinations} scheduled vaccine${summary.pendingVaccinations === 1 ? "" : "s"} to review.`
                    : "Your vaccination schedule looks clear right now. Add a pet or schedule the next care milestone when needed."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}

