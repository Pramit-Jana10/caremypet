"use client";

import Link from "next/link";
import type { Route } from "next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/utils/constants";

function AssistantInner() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Care assistant</h1>
          <p className="mt-1 text-sm text-ink-700">
            Central place to get help with health checks, guidance, and day-to-day care.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Symptom checker</h2>
          <p className="mt-2 text-sm text-ink-700">
            Select symptoms to see possible causes and when to call your vet.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-4">
            <Link href={ROUTES.symptomChecker as Route}>Open symptom checker</Link>
          </Button>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Community help</h2>
          <p className="mt-2 text-sm text-ink-700">
            Ask other pet parents about behavior, routines, and real-world tips.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-4">
            <Link href={ROUTES.community}>Go to community</Link>
          </Button>
        </section>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-ink-900">Chat assistant</h2>
        <p className="mt-2 text-sm text-ink-700">
          Use the floating chat bubble on any page to ask quick questions about products, vaccines,
          or general pet care. Answers are informational only and do not replace professional
          veterinary advice.
        </p>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <ProtectedRoute>
      <AssistantInner />
    </ProtectedRoute>
  );
}

