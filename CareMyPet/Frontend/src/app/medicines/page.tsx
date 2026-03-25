"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { medicineService } from "@/services/medicineService";
import type { Product } from "@/utils/types";
import { Loader } from "@/components/ui/Loader";
import { useCart } from "@/hooks/useCart";

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

const DEFAULT_PET_TYPES = ["Dog", "Cat", "Bird", "Fish", "Small Pet", "Other"];

export default function MedicinesPage() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [petType, setPetType] = useState<string>("All");
  const [medicines, setMedicines] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [extractedMedicines, setExtractedMedicines] = useState<string[]>([]);
  const [matchedMedicines, setMatchedMedicines] = useState<Product[]>([]);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [manualMedicineName, setManualMedicineName] = useState("");
  const [manualMatchedMedicines, setManualMatchedMedicines] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await medicineService.list();
        setMedicines(data);
      } catch {
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const petTypes = useMemo(
    () => ["All", ...unique([...DEFAULT_PET_TYPES, ...medicines.map((medicine) => medicine.petType)])],
    [medicines]
  );

  const filtered = useMemo(
    () =>
      medicines.filter((m) => {
        const matchesQ = q.trim() ? m.name.toLowerCase().includes(q.trim().toLowerCase()) : true;
        const matchesPet = petType === "All" ? true : m.petType === petType;
        return matchesQ && matchesPet;
      }),
    [q, petType, medicines]
  );

  const suggestedMedicines = matchedMedicines;
  const prescriptionMatchedIds = useMemo(() => new Set(matchedMedicines.map((medicine) => medicine.id)), [matchedMedicines]);

  const findMedicinesByName = (inputName: string) => {
    const query = inputName.trim().toLowerCase();
    if (!query) {
      setManualMatchedMedicines([]);
      return;
    }
    const matches = medicines.filter((medicine) => medicine.name.toLowerCase().includes(query));
    setManualMatchedMedicines(matches);
    if (matches.length === 0) {
      toast("No matching medicine found for manual entry.");
    }
  };

  const canAddMedicine = (medicine: Product) => {
    if (!medicine.prescriptionRequired) {
      return true;
    }
    return prescriptionMatchedIds.has(medicine.id);
  };

  const handleAddToCart = (medicine: Product, qty = 1) => {
    if (!canAddMedicine(medicine)) {
      toast.error("High-dose or prescription-required medicine needs a valid uploaded prescription.");
      return;
    }
    add(medicine, qty);
  };

  const handlePrescriptionUpload = async () => {
    if (!prescriptionFile) {
      toast.error("Please choose a prescription file first.");
      return;
    }

    setUploadingPrescription(true);
    try {
      const result = await medicineService.uploadPrescription(prescriptionFile);
      setUploadedFilename(result.filename ?? prescriptionFile.name);
      setExtractedMedicines(result.extractedMedicines ?? []);
      setMatchedMedicines(result.matchedMedicines ?? []);

      if ((result.extractedMedicines ?? []).length === 0) {
        toast("Prescription uploaded, but no medicine names were detected. Please try a clearer image.");
      } else {
        toast.success("Prescription uploaded and medicines matched automatically.");
      }
    } catch (error: any) {
      const message = error?.response?.status === 401
        ? "Please log in to upload a prescription."
        : "Prescription upload failed. Please try again.";
      toast.error(message);
    } finally {
      setUploadingPrescription(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 md:text-[2rem]">Medicine store</h1>
          <p className="mt-1 text-sm text-ink-700">
            Browse medicines and upload prescriptions as required.
          </p>
        </div>
        <div className="w-full max-w-xl">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search medicines..." />
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-ink-700">Pet type</label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm dark:bg-ink-200 dark:text-ink-900"
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            title="Pet type filter"
            aria-label="Pet type filter"
          >
            {petTypes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 text-xs text-ink-600">
          Non-prescription medicines can be added manually. High-dose or prescription-required medicines need a valid uploaded prescription before adding to cart.
        </div>
      </div>

      <div className="mt-6 rounded-[1.25rem] border border-brand-100/80 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Prescription upload and medicine matching</h2>
            <p className="mt-1 text-xs text-ink-700">
              Upload the prescription image and CareMyPet will automatically extract medicine names and match available medicines in the store.
            </p>
          </div>
          <div className="text-[11px] text-ink-600 md:max-w-xs">
            Best results: use a clear, bright image where prescription text is visible.
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,1.2fr]">
          <div className="rounded-xl border border-ink-100/70 bg-white p-4 shadow-sm dark:border-ink-200/70 dark:bg-ink-200">
            <label className="mb-1 block text-xs font-semibold text-ink-700">Upload prescription</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setPrescriptionFile(e.target.files?.[0] ?? null)}
              aria-label="Upload prescription"
              title="Upload prescription"
              className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-800 hover:file:bg-ink-200"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => void handlePrescriptionUpload()} disabled={uploadingPrescription}>
                {uploadingPrescription ? "Uploading..." : "Upload prescription"}
              </Button>
              <span className="text-[11px] text-ink-600">
                {uploadedFilename || prescriptionFile?.name || "No file uploaded yet"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-ink-100/70 bg-white p-4 shadow-sm dark:border-ink-200/70 dark:bg-ink-200">
            <label className="mb-1 block text-xs font-semibold text-ink-700">Extracted medicine names</label>
            {extractedMedicines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {extractedMedicines.map((name) => (
                  <span key={name} className="rounded-full bg-ink-100 px-2 py-1 text-xs text-ink-800">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-600">No extracted names yet. Upload a prescription image to auto-detect medicines.</p>
            )}
            <p className="mt-2 text-[11px] text-ink-600">
              You can also enter medicine names manually below if needed.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-ink-100/70 bg-white p-4 shadow-sm dark:border-ink-200/70 dark:bg-ink-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-ink-700">Manual medicine entry</label>
              <Input
                value={manualMedicineName}
                onChange={(e) => setManualMedicineName(e.target.value)}
                placeholder="Type a medicine name not visible in suggestions..."
              />
            </div>
            <Button size="sm" variant="secondary" onClick={() => findMedicinesByName(manualMedicineName)}>
              Find medicine
            </Button>
          </div>

          {manualMatchedMedicines.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {manualMatchedMedicines.map((medicine) => {
                const allowAdd = canAddMedicine(medicine);
                return (
                  <div key={`manual-${medicine.id}`} className="rounded-xl border border-ink-100/70 bg-ink-50 p-3 dark:border-ink-200/70 dark:bg-ink-200/70">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{medicine.name}</p>
                        <p className="mt-1 text-xs text-ink-600">{medicine.petType} • {medicine.category}</p>
                      </div>
                      {medicine.prescriptionRequired ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Prescription required</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Manual allowed</span>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => handleAddToCart(medicine, 1)} disabled={!allowAdd}>
                        {allowAdd ? "Add to cart" : "Upload prescription first"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-ink-100/70 bg-white p-4 shadow-sm dark:border-ink-200/70 dark:bg-ink-200">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Suggested available medicines</h3>
              <p className="mt-1 text-xs text-ink-600">
                Suggestions are generated automatically from extracted prescription medicines.
              </p>
            </div>
            <span className="rounded-full bg-brand-100 px-2 py-1 text-[11px] font-medium text-brand-800">
              {suggestedMedicines.length} match{suggestedMedicines.length === 1 ? "" : "es"}
            </span>
          </div>

          {suggestedMedicines.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {suggestedMedicines.map((medicine) => (
                <div key={`rx-${medicine.id}`} className="rounded-xl border border-ink-100/70 bg-ink-50 p-3 dark:border-ink-200/70 dark:bg-ink-200/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{medicine.name}</p>
                      <p className="mt-1 text-xs text-ink-600">{medicine.petType} • {medicine.category}</p>
                    </div>
                    {medicine.prescriptionRequired ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Prescription required</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Available</span>
                    )}
                  </div>
                  {medicine.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-700">{medicine.description}</p>
                  ) : null}
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={() => handleAddToCart(medicine, 1)}>
                      Add to cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-600">
              Upload a prescription image to see automatically matched medicines available in the system.
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader label="Loading medicines..." />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-ink-600">{m.category}</p>
                  <p className="mt-1 block text-base font-semibold text-ink-900">{m.name}</p>
                  <p className="mt-1 text-sm text-ink-700">{m.petType}</p>
                </div>
                {m.prescriptionRequired ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Prescription required</span>
                ) : null}
              </div>
              {m.description ? <p className="mt-3 text-xs text-ink-700">{m.description}</p> : null}
              <div className="mt-4 flex items-center justify-end gap-3">
                <Button onClick={() => handleAddToCart(m, 1)} disabled={!canAddMedicine(m)}>
                  {canAddMedicine(m) ? "Add to cart" : "Upload prescription first"}
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-ink-600">No medicines found.</p> : null}
        </div>
      )}
    </div>
  );
}

