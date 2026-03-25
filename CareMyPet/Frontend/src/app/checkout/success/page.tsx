"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/utils/constants";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-soft">
        <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
          Success
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-ink-900">Order confirmed</h1>
        <p className="mt-2 text-sm text-ink-700">
          Thanks for shopping with CareMyPet. You can track your orders in the dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild href={ROUTES.dashboard}>
            Go to dashboard
          </Button>
          <Button asChild variant="secondary" href={ROUTES.shop}>
            Keep shopping
          </Button>
        </div>
        <p className="mt-6 text-xs text-ink-500">
          Need help? Visit your{" "}
          <Link className="text-brand-700 hover:underline" href={ROUTES.profile}>
            profile
          </Link>{" "}
          or chat with the assistant.
        </p>
      </div>
    </div>
  );
}

