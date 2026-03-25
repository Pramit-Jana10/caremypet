"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { contactService } from "@/services/contactService";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please enter at least 10 characters in your feedback.");
      return;
    }

    setLoading(true);
    try {
      await contactService.sendFeedback({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      toast.success("Thanks. Your feedback was sent.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Unable to send feedback right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-8 shadow-soft">
          <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
            Contact Us
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-ink-900">We would love your feedback</h1>
          <p className="mt-3 text-sm text-ink-700">
            Send us suggestions, issues, or ideas. Your message goes directly to the CareMyPet admin inbox.
          </p>
          <div className="mt-6 space-y-3 rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-700 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
                  <path d="m3 8 9 6 9-6" />
                </svg>
              </span>
              <p>
                Email: <span className="font-semibold text-ink-900">caremypetofficial@gmail.com</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-700 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.35 1.78.68 2.62a2 2 0 0 1-.45 2.11L8.1 9.7a16 16 0 0 0 6.2 6.2l1.25-1.24a2 2 0 0 1 2.11-.45c.84.33 1.72.56 2.62.68A2 2 0 0 1 22 16.92Z" />
                </svg>
              </span>
              <p>
                Phone: <span className="font-semibold text-ink-900">+91 98765 43210</span>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-soft">
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
            <Input
              label="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-800">Feedback</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Tell us what we can improve"
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/50"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Feedback"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
