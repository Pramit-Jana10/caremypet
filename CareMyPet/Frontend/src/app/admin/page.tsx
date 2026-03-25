"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { adminService } from "@/services/adminService";
import { ROUTES } from "@/utils/constants";
import type { User } from "@/utils/types";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

function AdminInner() {
  const { user, refreshMe } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [plan, setPlan] = useState("premium");
  const [featuresCsv, setFeaturesCsv] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    const data = await adminService.listUsers();
    setUsers(data);
    if (!targetUserId && data.length > 0) {
      setTargetUserId(data[0].id);
    }
  };

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (user?.role !== "admin") {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await loadUsers();
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const selectedUser = users.find((u) => u.id === targetUserId) || null;
  const premiumUsers = users.filter((u) => !!u.subscription?.isPremium).length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

  useEffect(() => {
    if (!selectedUser) return;
    const sub = selectedUser.subscription;
    setEnabled(!!sub?.isPremium);
    setPlan(sub?.plan || "premium");
    setFeaturesCsv((sub?.premiumFeatures || []).join(", "));
    setExpiresOn(sub?.premiumExpiresOn ? String(sub.premiumExpiresOn).slice(0, 10) : "");
  }, [selectedUser]);

  const onSavePremium = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    setSaving(true);
    try {
      const features = featuresCsv
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const updated = await adminService.updateUserPremium(selectedUser.id, {
        enabled,
        plan: plan.trim() || "premium",
        features,
        expiresOn: expiresOn || undefined
      });

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("Premium settings updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update premium settings");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h1 className="text-xl font-semibold text-ink-900">Admin bootstrap</h1>
          <p className="mt-2 text-sm text-ink-700">Your account is not recognized as an admin yet.</p>

          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-700">
            <li>Add your email to the backend ADMIN_EMAILS environment variable.</li>
            <li>Restart the backend server.</li>
            <li>Sign in again using normal login with that admin email.</li>
          </ol>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild href={ROUTES.login}>
              Go to login
            </Button>
            <Link href={ROUTES.login} className="inline-flex items-center text-sm text-ink-700 hover:underline">
              Use normal user login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center">
          <Loader label="Loading admin data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink-900">Admin panel</h1>
      <p className="mt-1 text-sm text-ink-700">Manage premium subscriptions and feature access.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Users</h2>
          <p className="mt-1 text-xs text-ink-600">Total: {users.length}</p>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Premium users</h2>
          <p className="mt-1 text-xs text-ink-600">Total: {premiumUsers}</p>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Admins</h2>
          <p className="mt-1 text-xs text-ink-600">Total: {adminUsers}</p>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Premium management</h2>
          <p className="mt-1 text-xs text-ink-600">Grant or revoke premium plan access by user.</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-800" htmlFor="target-user">
                User
              </label>
              <select
                id="target-user"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-ink-800">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enable premium access
            </label>

            <Input label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="premium" />

            <Input
              label="Premium features (comma separated)"
              value={featuresCsv}
              onChange={(e) => setFeaturesCsv(e.target.value)}
              placeholder="learning_plus, advanced_reports"
            />

            <Input
              label="Expiration date"
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
            />

            <Button className="w-full" onClick={onSavePremium} disabled={saving || !targetUserId}>
              {saving ? "Saving..." : "Save premium settings"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Current subscriptions</h2>
          <div className="mt-4 space-y-3">
            {users.map((u) => (
              <article key={u.id} className="rounded-xl border border-ink-100 p-3">
                <p className="text-sm font-medium text-ink-900">{u.name}</p>
                <p className="text-xs text-ink-600">{u.email}</p>
                <p className="mt-2 text-xs text-ink-700">
                  Plan: <span className="font-medium">{u.subscription?.plan || "free"}</span>
                </p>
                <p className="text-xs text-ink-700">
                  Premium: <span className="font-medium">{u.subscription?.isPremium ? "Yes" : "No"}</span>
                </p>
                <p className="text-xs text-ink-700">
                  Features: {(u.subscription?.premiumFeatures || []).join(", ") || "None"}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminInner />
    </ProtectedRoute>
  );
}

