"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { orderService } from "@/services/orderService";
import { vaccineService } from "@/services/vaccineService";
import { mockHealthRecords } from "@/utils/mockData";
import type { Order, PetProfile, VaccineScheduleItem } from "@/utils/types";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import Link from "next/link";
import { ROUTES } from "@/utils/constants";

type DashboardReminder = {
  id: string;
  label: string;
  dueDateIso: string;
  kind: "Vaccination" | "Grooming" | "Medicine";
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-4 shadow-soft dark:border-ink-200 dark:bg-ink-100">
      <p className="text-xs font-semibold text-ink-600">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function getDailyInsights(pet: PetProfile | undefined): { title: string; body: string }[] {
  if (!pet) {
    return [
      {
        title: "Add a pet to personalize tips",
        body: "Create a pet profile so we can tailor bonding, grooming, and emergency tips for your companion."
      }
    ];
  }

  const species = pet.type;
  const age = pet.ageYears;

  const insights: { title: string; body: string }[] = [];

  insights.push({
    title: "Bonding & relationship building",
    body:
      species === "Dog"
        ? "Short training games (2–3 minutes) with treats and praise build trust quickly. End sessions while your dog is still engaged."
        : "Use gentle play with toys and slow blinking to build trust with your cat. Let them choose when to approach you."
  });

  insights.push({
    title: "Bathing instructions",
    body:
      species === "Dog"
        ? "Most dogs do best with a bath every 3–4 weeks, but brushing several times a week keeps the coat and skin healthier."
        : "Cats often self-groom, but a quick brushing session reduces shedding and helps you spot skin issues early."
  });

  insights.push({
    title: "Grooming & hygiene tips",
    body:
      species === "Dog"
        ? "Check paws after walks, trim nails regularly, and clean ears weekly to prevent odor and irritation."
        : "Brush the coat gently, inspect ears and eyes weekly, and keep litter hygiene consistent to reduce stress and illness risk."
  });

  insights.push({
    title: "Emergency preparedness",
    body:
      "Keep your vet’s number, an emergency clinic contact, and basic first-aid items (gauze, antiseptic, muzzle or towel) in one easy-to-grab place."
  });

  if (age < 1 && species === "Dog") {
    insights.push({
      title: "Puppy socialization tip",
      body:
        "Show your puppy calm, positive experiences with new sounds and surfaces. Pair each new thing with treats so they feel safe."
    });
  }

  return insights.slice(0, 4);
}

function getPersonalizedRecommendations(pet: PetProfile | undefined) {
  if (!pet) return [];

  const recs: string[] = [];

  if (pet.type === "Dog") {
    recs.push("Plan 2 short training sessions daily to build consistency and confidence.");
  }

  if (pet.type === "Cat") {
    recs.push("Use puzzle feeders and short play bursts to support healthy activity and enrichment.");
  }

  if (pet.ageYears < 1) {
    recs.push("Prioritize socialization and reward-based handling to shape lifelong behavior.");
  } else if (pet.ageYears >= 7) {
    recs.push("Schedule more frequent mobility and weight checks as your pet enters senior years.");
  }

  if (pet.healthConditions?.length) {
    recs.push(`Review routines around: ${pet.healthConditions.join(", ")}. Keep notes after meals and grooming.`);
  }

  if (pet.breed.toLowerCase().includes("labrador")) {
    recs.push("Labrador care focus: controlled portions, joint-friendly exercise, and regular ear checks.");
  }

  return recs.slice(0, 4);
}

type UserCoords = { lat: number; lng: number };

function DashboardInner() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [schedule, setSchedule] = useState<VaccineScheduleItem[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [orderRes, petsRes] = await Promise.all([
          orderService.listMyOrders().catch(() => []),
          vaccineService.listPets().catch(() => [])
        ]);
        setOrders(orderRes);
        setPets(petsRes);
        const firstPet = petsRes[0];
        if (firstPet) {
          setSelectedPetId(firstPet.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedPetId) {
      setSchedule([]);
      return;
    }

    vaccineService
      .listSchedule(selectedPetId)
      .then((sched) => setSchedule(sched))
      .catch(() => setSchedule([]));
  }, [selectedPetId]);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) ?? pets[0],
    [pets, selectedPetId]
  );

  const reminders = useMemo<DashboardReminder[]>(() => {
    if (!selectedPet?.id) return [];

    const vaccineReminders = schedule
      .filter((s) => s.status === "Pending")
      .map((s) => ({
        id: `v-${s.id}`,
        label: s.vaccineName,
        dueDateIso: s.dueDateIso,
        kind: "Vaccination" as const
      }));

    const careReminders = mockHealthRecords
      .filter((r) => r.petId === selectedPet.id && r.nextDueIso)
      .map((r) => ({
        id: `h-${r.id}`,
        label: r.label,
        dueDateIso: r.nextDueIso as string,
        kind: (r.type === "Grooming" || r.type === "Bathing" ? "Grooming" : "Medicine") as
          | "Grooming"
          | "Medicine"
      }));

    return [...vaccineReminders, ...careReminders]
      .sort((a, b) => new Date(a.dueDateIso).getTime() - new Date(b.dueDateIso).getTime())
      .slice(0, 6);
  }, [schedule, selectedPet]);

  const missingCareItems = useMemo(() => {
    if (!selectedPet?.id) return [];

    const records = mockHealthRecords.filter((r) => r.petId === selectedPet.id);
    const available = new Set(records.map((r) => r.type));
    const required: Array<"Vaccination" | "Deworming" | "Flea & Tick" | "Grooming" | "Bathing"> = [
      "Vaccination",
      "Deworming",
      "Flea & Tick",
      "Grooming",
      "Bathing"
    ];

    return required.filter((r) => !available.has(r));
  }, [selectedPet]);

  const dailyInsights = useMemo(() => getDailyInsights(selectedPet), [selectedPet]);
  const personalizedRecommendations = useMemo(
    () => getPersonalizedRecommendations(selectedPet),
    [selectedPet]
  );

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    setUserCoords(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setLocationError("Unable to retrieve your location. Please allow location access and try again.");
        setLocationLoading(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center">
          <Loader label="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Pet dashboard</h1>
          <p className="mt-1 text-sm text-ink-700">
            Quick overview of your selected pet, health reminders, and learning resources.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={ROUTES.shop}>Shop now</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.vets}>View vets</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Orders" value={orders.length.toString()} />
        <StatCard label="Pets" value={pets.length.toString()} />
        <StatCard label="Upcoming reminders" value={reminders.length.toString()} />
      </div>

      {/* Emergency: Nearby Pet Centres */}
      <div className="mt-6 rounded-[1.25rem] border border-red-200/70 bg-[linear-gradient(120deg,rgba(255,242,242,0.92)_0%,rgba(255,255,255,0.95)_45%,rgba(255,246,236,0.92)_100%)] p-5 shadow-soft dark:border-red-900/40 dark:bg-[linear-gradient(120deg,rgba(74,22,30,0.45)_0%,rgba(16,28,51,0.95)_45%,rgba(72,36,20,0.45)_100%)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-base dark:bg-red-900/50" aria-hidden>🚨</span>
              <h2 className="text-sm font-semibold text-red-900 dark:text-red-300">Emergency — Nearby Pet Centres</h2>
            </div>
            <p className="mt-1 max-w-xl text-xs text-ink-700">
              If your pet is unwell, injured, or needs urgent care, use your location to find the nearest
              veterinary clinic, animal hospital, or pet care centre instantly.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleGetLocation}
            disabled={locationLoading}
            className="bg-white/95 text-ink-900 hover:bg-white dark:bg-ink-200 dark:text-ink-900 dark:hover:bg-ink-300"
          >
            {locationLoading ? "Detecting location…" : userCoords ? "Refresh location" : "Find nearby pet centres"}
          </Button>
        </div>

        {locationError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {locationError}
          </div>
        ) : null}

        {userCoords ? (
          <div className="mt-4">
            <p className="mb-3 text-[11px] text-ink-500">
              Location detected — {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <a
                href={`https://www.google.com/maps/search/veterinary+clinic/@${userCoords.lat},${userCoords.lng},14z`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-emerald-200 bg-white px-4 py-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-emerald-900/40 dark:bg-ink-200"
              >
                <span className="text-xl" aria-hidden>🏥</span>
                <span className="mt-2 text-sm font-semibold text-emerald-800">Veterinary Clinics</span>
                <span className="mt-1 text-xs text-ink-600">Nearest certified vets for check-ups &amp; treatment</span>
                <span className="mt-3 text-[11px] font-medium text-emerald-600 group-hover:underline">Open in Google Maps →</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/emergency+pet+hospital/@${userCoords.lat},${userCoords.lng},14z`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-red-200 bg-white px-4 py-4 shadow-sm transition hover:border-red-400 hover:shadow-md dark:border-red-900/40 dark:bg-ink-200"
              >
                <span className="text-xl" aria-hidden>🚑</span>
                <span className="mt-2 text-sm font-semibold text-red-800">Emergency Hospitals</span>
                <span className="mt-1 text-xs text-ink-600">24/7 emergency animal hospitals nearby</span>
                <span className="mt-3 text-[11px] font-medium text-red-600 group-hover:underline">Open in Google Maps →</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/pet+care+centre/@${userCoords.lat},${userCoords.lng},14z`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-purple-200 bg-white px-4 py-4 shadow-sm transition hover:border-purple-400 hover:shadow-md dark:border-purple-900/40 dark:bg-ink-200"
              >
                <span className="text-xl" aria-hidden>🐾</span>
                <span className="mt-2 text-sm font-semibold text-purple-800">Pet Care Centres</span>
                <span className="mt-1 text-xs text-ink-600">Grooming, boarding, daycare &amp; wellness</span>
                <span className="mt-3 text-[11px] font-medium text-purple-600 group-hover:underline">Open in Google Maps →</span>
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1.3fr]">
        <div className="space-y-4">
          <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Pet profile</h2>
                <p className="mt-1 text-xs text-ink-700">
                  Switch between pets to see personalized insights.
                </p>
              </div>
              {pets.length > 0 ? (
                <div className="inline-flex rounded-xl bg-ink-50 p-1 text-xs">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedPetId(pet.id)}
                      className={"rounded-xl px-2 py-1 " + (pet.id === selectedPet?.id ? "bg-white text-ink-900 shadow-soft" : "text-ink-700 hover:bg-ink-100")}>
                      {pet.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {selectedPet ? (
              <div className="mt-4 flex gap-4">
                {selectedPet.photoUrl ? (
                  <div className="hidden h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-ink-100 sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPet.photoUrl}
                      alt={selectedPet.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="space-y-1 text-sm">
                  <p className="text-base font-semibold text-ink-900">{selectedPet.name}</p>
                  <p className="text-ink-700">
                    {selectedPet.type} • {selectedPet.breed}
                  </p>
                  <p className="text-ink-600">
                    Age: {selectedPet.ageYears} years
                    {selectedPet.gender ? ` • ${selectedPet.gender}` : ""}
                    {selectedPet.weightKg ? ` • ${selectedPet.weightKg} kg` : ""}
                  </p>
                  {selectedPet.healthConditions && selectedPet.healthConditions.length > 0 ? (
                    <p className="text-xs text-ink-600">
                      Health notes: {selectedPet.healthConditions.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-ink-600">
                No pets added yet. Create a pet profile from the vaccinations page to get started.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
              <h2 className="text-sm font-semibold text-ink-900">Upcoming reminders</h2>
              <div className="mt-3 space-y-2 text-xs">
                {reminders.map((r) => {
                  const overdue = new Date(r.dueDateIso) < new Date();
                  return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2"
                  >
                    <span>
                      {r.label} · {new Date(r.dueDateIso).toLocaleDateString()}
                    </span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                        (overdue
                          ? "bg-red-100 text-red-800"
                          : r.kind === "Vaccination"
                            ? "bg-amber-100 text-amber-900"
                            : r.kind === "Grooming"
                              ? "bg-sky-100 text-sky-900"
                              : "bg-emerald-100 text-emerald-900")
                      }
                    >
                      {overdue ? "Overdue" : r.kind}
                    </span>
                  </div>
                );
                })}
                {reminders.length === 0 ? (
                  <p className="text-xs text-ink-600">
                    No upcoming reminders. You can add them from vaccinations and diary records.
                  </p>
                ) : null}
                {missingCareItems.length > 0 ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                    Missing records: {missingCareItems.join(", ")}.
                  </p>
                ) : null}
                <p className="mt-3 text-[11px] text-ink-600">
                  You can also track grooming, deworming, and flea & tick control from the diary.
                </p>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
              <h2 className="text-sm font-semibold text-ink-900">Quick actions</h2>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <Button asChild variant="secondary">
                  <Link href={ROUTES.vaccinations}>Manage vaccinations</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={ROUTES.diary}>Open health diary</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={ROUTES.library}>Training & articles</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={ROUTES.assistant}>Open care assistant</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.25rem] border border-brand-100/80 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-ink-900">Daily care playbook</h2>
            <p className="mt-1 text-xs text-ink-700">
              Organized guidance to keep your pet healthy, bonded, and prepared for emergencies.
            </p>

            {personalizedRecommendations.length > 0 ? (
              <div className="mt-3 rounded-xl border border-brand-200 bg-brand-100/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">Personalized recommendation</p>
                <p className="mt-1 text-xs font-medium text-ink-900">{personalizedRecommendations[0]}</p>
              </div>
            ) : null}

            <div className="mt-3 grid gap-3">
              {dailyInsights.map((insight) => {
                const icon = insight.title.includes("Bonding")
                  ? "🤝"
                  : insight.title.includes("Bathing")
                    ? "🛁"
                    : insight.title.includes("Grooming")
                      ? "✂️"
                      : "🚨";

                return (
                  <div key={insight.title} className="rounded-xl border border-ink-100/70 bg-white px-4 py-3 shadow-sm dark:border-ink-200/70 dark:bg-ink-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-xs" aria-hidden>
                        {icon}
                      </span>
                      <h3 className="text-xs font-semibold text-ink-900">{insight.title}</h3>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-700">{insight.body}</p>
                  </div>
                );
              })}
            </div>

            {personalizedRecommendations.length > 1 ? (
              <div className="mt-3 rounded-xl border border-ink-100/70 bg-white px-4 py-3 dark:border-ink-200/70 dark:bg-ink-200">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Additional recommendations</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-ink-700">
                  {personalizedRecommendations.slice(1).map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <h2 className="text-sm font-semibold text-ink-900">Recent orders</h2>
            <div className="mt-3 space-y-2 text-sm">
              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2"
                >
                  <span>
                    #{o.id} · {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-ink-900">{formatCurrency(o.total)}</span>
                </div>
              ))}
              {orders.length === 0 ? (
                <p className="text-xs text-ink-600">No orders yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}



