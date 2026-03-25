"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { mockCommunityQuestions } from "@/utils/mockData";
import type { CommunityQuestion } from "@/utils/types";

function CommunityInner() {
  const [questions, setQuestions] = useState<CommunityQuestion[]>(mockCommunityQuestions);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    petName: "",
    petAgeYears: "",
    petBreed: "",
    question: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.petName.trim()) return;

    const newQuestion: CommunityQuestion = {
      id: `q-${Date.now()}`,
      petName: form.petName.trim(),
      petAgeYears: Number(form.petAgeYears) || 0,
      petBreed: form.petBreed.trim() || "Unknown",
      question: form.question.trim(),
      createdAt: new Date().toISOString(),
      answers: []
    };
    setQuestions((prev) => [newQuestion, ...prev]);
    setForm({
      petName: "",
      petAgeYears: "",
      petBreed: "",
      question: ""
    });
  };

  const handleReply = (questionId: string) => {
    const reply = (draftAnswers[questionId] ?? "").trim();
    if (!reply) return;

    setQuestions((prev) =>
      prev.map((q) =>
        q.id !== questionId
          ? q
          : {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: `a-${Date.now()}`,
                  author: "You",
                  body: reply,
                  createdAt: new Date().toISOString()
                }
              ]
            }
      )
    );
    setDraftAnswers((prev) => ({ ...prev, [questionId]: "" }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Pet community</h1>
          <p className="mt-1 text-sm text-ink-700">
            Ask questions, share experiences, and learn from other pet parents.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr,1.8fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl bg-white p-5 shadow-soft text-sm"
        >
          <h2 className="text-sm font-semibold text-ink-900">Ask a question</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-700">
                Pet name
                <input
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
                  value={form.petName}
                  onChange={(e) => setForm((f) => ({ ...f, petName: e.target.value }))}
                  required
                />
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-700">
                Age (years)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
                  value={form.petAgeYears}
                  onChange={(e) => setForm((f) => ({ ...f, petAgeYears: e.target.value }))}
                />
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-ink-700">
                Breed
                <input
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
                  value={form.petBreed}
                  onChange={(e) => setForm((f) => ({ ...f, petBreed: e.target.value }))}
                  placeholder="e.g., Labrador, Persian cat"
                />
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700">
              Your question
              <textarea
                className="mt-1 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
                rows={3}
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="Example: Why does my dog spin before sleeping?"
                required
              />
            </label>
          </div>
          <p className="text-[11px] text-ink-600">
            Do not share emergency cases here. For urgent health concerns, contact a veterinarian
            immediately.
          </p>
          <Button type="submit" size="md">
            Post question
          </Button>
        </form>

        <div className="space-y-4">
          {questions.map((q) => (
            <article key={q.id} className="rounded-2xl bg-white p-5 shadow-soft text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink-900">{q.petName}</p>
                  <p className="text-[11px] text-ink-600">
                    {q.petAgeYears ? `${q.petAgeYears} years • ` : ""}
                    {q.petBreed}
                  </p>
                </div>
                <p className="text-[11px] text-ink-500">
                  {new Date(q.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric"
                  })}
                </p>
              </div>
              <p className="mt-3 text-sm text-ink-900">{q.question}</p>
              {q.answers.length > 0 ? (
                <div className="mt-3 space-y-2 rounded-xl bg-ink-50 p-3 text-xs">
                  {q.answers.map((a) => (
                    <div key={a.id}>
                      <p className="font-medium text-ink-800">{a.author}</p>
                      <p className="mt-1 text-ink-700">{a.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-ink-600">No answers yet. Be the first to help!</p>
              )}

              <div className="mt-3 rounded-xl bg-ink-50 p-3">
                <label className="text-[11px] font-medium text-ink-700">Add your response</label>
                <textarea
                  rows={2}
                  value={draftAnswers[q.id] ?? ""}
                  onChange={(e) =>
                    setDraftAnswers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-500"
                  placeholder="Share what worked for your pet..."
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => handleReply(q.id)}
                >
                  Post response
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <CommunityInner />
    </ProtectedRoute>
  );
}

