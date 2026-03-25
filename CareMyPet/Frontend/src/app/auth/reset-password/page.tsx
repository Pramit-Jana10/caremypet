"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { ROUTES } from "@/utils/constants";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; token?: string }>({});

  function validate() {
    const nextErrors: typeof errors = {};
    if (!token) nextErrors.token = "Reset token is missing. Please use the link from your email.";
    if (password.length < 12) nextErrors.password = "Password must be at least 12 characters";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success("Password reset successful. Please sign in.");
      router.push(ROUTES.login as any);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink-900">Set a new password</h1>
        <p className="mt-2 text-sm text-ink-700">Enter a new secure password for your account.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {errors.token ? <p className="text-sm text-red-600">{errors.token}</p> : null}

          <Input
            label="New password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.4 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a16.9 16.9 0 0 1-3.2 4.1" />
                    <path d="M6.2 6.2C3.8 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 2.6-.2" />
                  </svg>
                )}
              </button>
            }
          />

          <Input
            label="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            error={errors.confirmPassword}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                title={showConfirmPassword ? "Hide password" : "Show password"}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.4 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a16.9 16.9 0 0 1-3.2 4.1" />
                    <path d="M6.2 6.2C3.8 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 2.6-.2" />
                  </svg>
                )}
              </button>
            }
          />

          <Button className="w-full" disabled={loading || !token} type="submit">
            {loading ? "Updating..." : "Reset password"}
          </Button>
        </form>

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
