"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSendOtp() {
    if (!email || !email.includes("@")) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email" }));
      return;
    }
    setSendingOtp(true);
    try {
      await authService.sendLoginOtp(email);
      setOtpSent(true);
      setOtpToken(null);
      toast.success("Admin OTP sent to your email");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send login OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp) {
      setErrors((prev) => ({ ...prev, otp: "Enter the OTP sent to your email" }));
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await authService.verifyLoginOtp(email, otp);
      setOtpToken(res.otpToken);
      toast.success("Two-factor code verified");
      setErrors((prev) => ({ ...prev, otp: undefined }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Invalid or expired OTP");
      setOtpToken(null);
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!otpToken) {
      setErrors((prev) => ({ ...prev, otp: "Please verify OTP before signing in" }));
      toast.error("Two-factor verification required");
      return;
    }
    setLoading(true);
    try {
      await adminLogin({ email, password, otpToken });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink-900">Admin login</h1>
        <p className="mt-2 text-sm text-ink-700">Sign in as an administrator to manage premium features.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input label="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />

          <div className="space-y-2">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={sendingOtp || !email}
              onClick={handleSendOtp}
            >
              {sendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send Admin OTP"}
            </Button>
          </div>

          <div className="space-y-2">
            <Input label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} error={errors.otp} />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={verifyingOtp || !otp}
              onClick={handleVerifyOtp}
            >
              {verifyingOtp ? "Verifying..." : otpToken ? "OTP Verified" : "Verify OTP"}
            </Button>
          </div>

          <Button className="w-full" disabled={loading || !otpToken} type="submit">
            {loading ? "Signing in..." : "Continue to admin"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href={ROUTES.login} className="text-ink-700 hover:underline">
            Back to user login
          </Link>
          <Link href={ROUTES.forgotPassword} className="text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
