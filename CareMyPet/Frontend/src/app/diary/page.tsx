"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { mockHealthRecords, mockPets } from "@/utils/mockData";
import type { HealthRecord, PetProfile } from "@/utils/types";

type GroupedRecords = Record<string, HealthRecord[]>;

function groupByPet(records: HealthRecord[]): GroupedRecords {
  return records.reduce<GroupedRecords>((acc, rec) => {
    acc[rec.petId] = acc[rec.petId] || [];
    acc[rec.petId].push(rec);
    return acc;
  }, {});
}

function isOverdue(rec: HealthRecord, now: Date) {
  if (!rec.nextDueIso) return false;
  return new Date(rec.nextDueIso) < now;
}

function isDueSoon(rec: HealthRecord, now: Date, withinDays = 7) {
  if (!rec.nextDueIso) return false;
  const due = new Date(rec.nextDueIso).getTime();
  const start = now.getTime();
  const end = start + withinDays * 24 * 60 * 60 * 1000;
  return due >= start && due <= end;
}

const BREED_MAP: Record<string, string[]> = {
  Dog: ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Bulldog", "Poodle", "Beagle", "Rottweiler", "Chihuahua", "Siberian Husky", "Boxer", "Doberman", "Shih Tzu", "Pomeranian", "Dachshund", "Cocker Spaniel", "Other"],
  Cat: ["Persian", "Siamese", "Maine Coon", "Ragdoll", "Bengal", "British Shorthair", "Abyssinian", "Scottish Fold", "Sphynx", "Birman", "Russian Blue", "Burmese", "Turkish Angora", "Other"],
  Bird: ["Parrot", "Cockatiel", "Canary", "Budgerigar", "Finch", "Macaw", "Lovebird", "Cockatoo", "African Grey", "Mynah", "Other"],
  Rabbit: ["Holland Lop", "Mini Rex", "Lionhead", "Dutch", "Angora", "Flemish Giant", "Netherland Dwarf", "Rex", "Mini Lop", "Californian", "Other"],
  Fish: ["Goldfish", "Betta", "Guppy", "Angelfish", "Neon Tetra", "Clownfish", "Oscar", "Molly", "Swordtail", "Discus", "Other"],
  Other: ["Mixed Breed", "Other"]
};

function DiaryInner() {
  const [selectedPetId, setSelectedPetId] = useState<string>(mockPets[0]?.id ?? "");
  const [petCardForm, setPetCardForm] = useState({
    name: "",
    petType: "",
    breed: "",
    ageYears: "",
    gender: "",
    weightKg: ""
  });
  const [petPhotoDataUrl, setPetPhotoDataUrl] = useState<string>("");
  const now = useMemo(() => new Date(), []);

  const grouped = useMemo(() => groupByPet(mockHealthRecords), []);
  const petsById = useMemo(
    () =>
      mockPets.reduce<Record<string, PetProfile>>((acc, pet) => {
        acc[pet.id] = pet;
        return acc;
      }, {}),
    []
  );

  const recordsForPet = useMemo(
    () => grouped[selectedPetId] ?? [],
    [grouped, selectedPetId]
  );
  const selectedPet = petsById[selectedPetId];
  const hasOverdue = recordsForPet.some((r) => isOverdue(r, now));
  const sortedRecords = useMemo(
    () =>
      recordsForPet
        .slice()
        .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()),
    [recordsForPet]
  );

  const overdueRecords = recordsForPet.filter((r) => isOverdue(r, now));
  const dueSoonRecords = recordsForPet.filter((r) => isDueSoon(r, now));
  const requiredTypes: Array<HealthRecord["type"]> = [
    "Vaccination",
    "Deworming",
    "Flea & Tick",
    "Grooming",
    "Bathing"
  ];
  const availableTypes = new Set(recordsForPet.map((r) => r.type));
  const missingTypes = requiredTypes.filter((type) => !availableTypes.has(type));

  const careSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (overdueRecords.length > 0) {
      suggestions.push(
        `${overdueRecords.length} care item(s) are overdue. Prioritize booking a vet visit for high-risk items first.`
      );
    }

    if (dueSoonRecords.length > 0) {
      suggestions.push(
        `${dueSoonRecords.length} item(s) are due in the next 7 days. Set reminders and prepare medicines/appointments now.`
      );
    }

    if (missingTypes.length > 0) {
      suggestions.push(
        `Missing record categories: ${missingTypes.join(", ")}. Add these to keep a complete preventive-care history.`
      );
    }

    if (recordsForPet.some((r) => r.type === "Bathing")) {
      suggestions.push("For sensitive skin pets, use vet-recommended shampoo and maintain consistent post-bath drying.");
    }

    if (suggestions.length === 0) {
      suggestions.push("Great consistency. Continue routine care tracking and monthly review of preventive treatments.");
    }

    return suggestions;
  }, [dueSoonRecords.length, missingTypes, overdueRecords.length, recordsForPet]);

  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) {
      setPetPhotoDataUrl("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPetPhotoDataUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  const handleExportCard = () => {
    if (typeof window === "undefined") return;

    if (!petCardForm.name || !petCardForm.petType || !petCardForm.breed || !petCardForm.ageYears || !petCardForm.gender) {
      window.alert("Please enter Name, Pet Type, Breed, Age, and Gender before exporting the pet card.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const cardId = `CMP-${Date.now().toString().slice(-6)}`;
    const issuedOn = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const escaped = {
      name: escapeHtml(petCardForm.name),
      petType: escapeHtml(petCardForm.petType),
      breed: escapeHtml(petCardForm.breed),
      ageYears: escapeHtml(petCardForm.ageYears),
      gender: escapeHtml(petCardForm.gender),
      weightKg: escapeHtml(petCardForm.weightKg)
    };

    const printWindow = window.open("", "_blank", "width=700,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Pet Health Card</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 24px; color: #1f2937; background: #f3f4f6; }
          .card {
            border: 1px solid #d1d5db;
            border-radius: 18px;
            padding: 0;
            max-width: 620px;
            background: #fff;
            overflow: hidden;
            box-shadow: 0 12px 24px rgba(17, 24, 39, 0.12);
          }
          .header {
            background: linear-gradient(135deg, #0f766e, #0369a1);
            color: #fff;
            padding: 18px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .app { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.92; }
          .title { margin: 4px 0 0; font-size: 20px; font-weight: 700; }
          .meta { text-align: right; font-size: 11px; line-height: 1.45; }
          .body { padding: 18px 20px 20px; }
          .identity { display: grid; grid-template-columns: 160px 1fr; gap: 14px; }
          .photo { width: 160px; height: 160px; object-fit: cover; border-radius: 12px; border: 1px solid #d1d5db; background: #f3f4f6; }
          .details { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
          .row { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed #e5e7eb; font-size: 13px; }
          .row:last-child { border-bottom: 0; }
          .label { font-weight: 700; color: #111827; }
          .value { color: #374151; text-align: right; }
          .summary { margin-top: 12px; border: 1px solid #d1fae5; border-radius: 12px; background: #ecfeff; padding: 10px 12px; font-size: 12px; color: #155e75; }
          .footer { margin-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div class="app">CareMyPet</div>
              <div class="title">Pet Health Card</div>
            </div>
            <div class="meta">
              <div>Card ID: ${cardId}</div>
              <div>Issued: ${issuedOn}</div>
            </div>
          </div>
          <div class="body">
            <div class="identity">
              ${petPhotoDataUrl ? `<img src="${petPhotoDataUrl}" alt="Pet" class="photo" />` : `<div class="photo"></div>`}
              <div class="details">
                <div class="row"><span class="label">Name</span><span class="value">${escaped.name}</span></div>
                <div class="row"><span class="label">Pet Type</span><span class="value">${escaped.petType}</span></div>
                <div class="row"><span class="label">Breed</span><span class="value">${escaped.breed}</span></div>
                <div class="row"><span class="label">Age</span><span class="value">${escaped.ageYears} years</span></div>
                <div class="row"><span class="label">Gender</span><span class="value">${escaped.gender}</span></div>
                ${escaped.weightKg ? `<div class="row"><span class="label">Weight</span><span class="value">${escaped.weightKg} kg</span></div>` : ""}
              </div>
            </div>
            <div class="summary">
              Health summary: ${overdueRecords.length} overdue item(s), ${dueSoonRecords.length} due in next 7 days.
            </div>
            <div class="footer">
              <span>Generated by CareMyPet</span>
              <span>Informational card - consult your veterinarian for diagnosis</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Health diary</h1>
          <p className="mt-1 text-sm text-ink-700">
            Digital health records for your pets with gentle overdue alerts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleExportCard}>
            Export health card
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Select pet</h2>
            <p className="mt-1 text-xs text-ink-600">
              Switch between pets to view individual health timelines.
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-ink-50 p-1 text-xs">
            {mockPets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => setSelectedPetId(pet.id)}
                className={
                  "rounded-xl px-2 py-1 " +
                  (selectedPetId === pet.id ? "bg-white text-ink-900 shadow-soft" : "text-ink-700 hover:bg-ink-100")
                }
              >
                {pet.name}
              </button>
            ))}
          </div>
        </div>

        {hasOverdue ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <p className="font-semibold">Attention needed</p>
            <ul className="mt-1 list-disc pl-4">
              {overdueRecords.map((r) => (
                <li key={r.id}>
                  {r.label} is overdue. Last done on{" "}
                  {new Date(r.dateIso).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                  .
                </li>
              ))}
            </ul>
            <p className="mt-1">
              These reminders are informational and do not replace veterinary advice.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs text-ink-600">
            No overdue items detected for this pet based on the sample records.
          </p>
        )}

        {selectedPet ? (
          <div className="mt-4 rounded-xl bg-ink-50 p-4 text-xs">
            <p className="font-semibold text-ink-900">Pet card</p>
            <p className="mt-1 text-ink-700">
              Enter details manually for the pet card export (required: Name, Pet Type, Breed, Age, Gender).
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={petCardForm.name}
                onChange={(e) => setPetCardForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name *"
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-400"
              />
              <select
                value={petCardForm.petType}
                onChange={(e) => setPetCardForm((prev) => ({ ...prev, petType: e.target.value, breed: "" }))}
                aria-label="Pet type"
                title="Pet type"
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-400"
              >
                <option value="">Select pet type *</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Fish">Fish</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={petCardForm.ageYears}
                onChange={(e) => setPetCardForm((prev) => ({ ...prev, ageYears: e.target.value }))}
                placeholder="Age in years *"
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-400"
              />
              <select
                value={petCardForm.breed}
                onChange={(e) => setPetCardForm((prev) => ({ ...prev, breed: e.target.value }))}
                aria-label="Breed"
                title="Breed"
                disabled={!petCardForm.petType}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-400 disabled:opacity-50"
              >
                <option value="">{petCardForm.petType ? "Select breed *" : "Select pet type first"}</option>
                {(BREED_MAP[petCardForm.petType] ?? []).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                value={petCardForm.gender}
                onChange={(e) => setPetCardForm((prev) => ({ ...prev, gender: e.target.value }))}
                aria-label="Gender"
                title="Gender"
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-400"
              >
                <option value="">Select gender *</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={petCardForm.weightKg}
                onChange={(e) => setPetCardForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                placeholder="Weight in kg"
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-400 sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-ink-700">Pet photo upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                  aria-label="Upload pet photo"
                  title="Upload pet photo"
                  className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-800 hover:file:bg-ink-200"
                />
                {petPhotoDataUrl ? (
                  <div className="mt-3 rounded-lg border border-ink-200 bg-white p-3">
                    <p className="mb-2 text-[11px] font-semibold text-ink-800">Preview</p>
                    <Image
                      src={petPhotoDataUrl}
                      alt="Pet preview"
                      width={112}
                      height={112}
                      unoptimized
                      className="h-28 w-28 rounded-lg border border-ink-200 object-cover"
                    />
                    <div className="mt-2 text-[11px] text-ink-700">
                      <p>Name: {petCardForm.name || "-"}</p>
                      <p>Pet Type: {petCardForm.petType || "-"}</p>
                      <p>Breed: {petCardForm.breed || "-"}</p>
                      <p>Age: {petCardForm.ageYears ? `${petCardForm.ageYears} years` : "-"}</p>
                      <p>Gender: {petCardForm.gender || "-"}</p>
                      <p>Weight: {petCardForm.weightKg ? `${petCardForm.weightKg} kg` : "-"}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {missingTypes.length > 0 ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
            <p className="font-semibold">Missing records detected</p>
            <p className="mt-1">Please add: {missingTypes.join(", ")}.</p>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Total records</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">{recordsForPet.length}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Overdue</p>
              <p className="mt-1 text-lg font-semibold text-red-700">{overdueRecords.length}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Due in 7 days</p>
              <p className="mt-1 text-lg font-semibold text-amber-700">{dueSoonRecords.length}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-semibold">Smart suggestions</p>
            <ul className="mt-1 list-disc pl-4">
              {careSuggestions.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedRecords.map((rec) => {
            const pet = petsById[rec.petId];
            const overdue = isOverdue(rec, now);
            const dueSoon = isDueSoon(rec, now);
            const typeTone =
              rec.type === "Vaccination"
                ? "bg-violet-100 text-violet-800"
                : rec.type === "Deworming"
                  ? "bg-blue-100 text-blue-800"
                  : rec.type === "Flea & Tick"
                    ? "bg-cyan-100 text-cyan-800"
                    : rec.type === "Grooming"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-pink-100 text-pink-800";

            return (
              <div key={rec.id} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <p className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + typeTone}>
                  {rec.type}
                  </p>
                  {overdue ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Overdue</span>
                  ) : dueSoon ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Due soon</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-ink-900">{rec.label}</p>
                <p className="mt-1 text-xs text-ink-700">
                  {pet ? `${pet.name} • ${pet.type} • ${pet.breed}` : rec.petId}
                </p>
                <p className="mt-1 text-xs text-ink-600">
                  Done on{" "}
                  {new Date(rec.dateIso).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </p>
                {rec.nextDueIso ? (
                  <p className="mt-1 text-xs text-ink-600">
                    Next due{" "}
                    {new Date(rec.nextDueIso).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </p>
                ) : null}
                {rec.notes ? (
                  <p className="mt-2 rounded-lg bg-ink-50 px-2 py-1.5 text-xs text-ink-700 leading-relaxed">{rec.notes}</p>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default function DiaryPage() {
  return (
    <ProtectedRoute>
      <DiaryInner />
    </ProtectedRoute>
  );
}

