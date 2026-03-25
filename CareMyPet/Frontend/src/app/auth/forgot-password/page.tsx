"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { ROUTES } from "@/utils/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("demo@smartpetcare.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [debugResetLink, setDebugResetLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setDebugResetLink(null);
    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      toast.success("If an account exists, you'll receive reset instructions.");
      if (res.debugResetLink) {
        setDebugResetLink(res.debugResetLink);
        toast("Email delivery failed in dev mode. Use the reset link shown below.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink-900">Reset your password</h1>
        <p className="mt-2 text-sm text-ink-700">We’ll email you a reset link if the account exists.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        {debugResetLink ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">Development fallback reset link:</p>
            <a href={debugResetLink} className="mt-1 block break-all text-xs text-brand-700 hover:underline">
              {debugResetLink}
            </a>
          </div>
        ) : null}

        <p className="mt-5 text-sm text-ink-700">
          Back to{" "}
          <Link href={ROUTES.login} className="text-brand-700 hover:underline">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}

