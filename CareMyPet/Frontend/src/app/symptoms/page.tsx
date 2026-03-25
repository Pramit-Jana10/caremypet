"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { vaccineService } from "@/services/vaccineService";
import { mockPets } from "@/utils/mockData";
import type { PetProfile, SymptomAssessment, SymptomCategory } from "@/utils/types";

type SymptomOptionByPet = {
  id: string;
  label: string;
  category: SymptomCategory;
  petTypes: Array<PetProfile["type"] | "All">;
};

const SYMPTOM_OPTIONS: SymptomOptionByPet[] = [
  // Digestive
  { id: "symp-constipation", label: "Constipation", category: "Digestive system", petTypes: ["Dog", "Cat", "Small Pet", "Other"] },
  { id: "symp-vomiting", label: "Vomiting", category: "Digestive system", petTypes: ["Dog", "Cat", "Other"] },
  { id: "symp-diarrhea", label: "Diarrhea", category: "Digestive system", petTypes: ["Dog", "Cat", "Small Pet", "Other"] },
  { id: "symp-loss-appetite", label: "Loss of appetite", category: "Digestive system", petTypes: ["Dog", "Cat", "Bird", "Fish", "Small Pet", "Other"] },
  // Respiratory
  { id: "symp-coughing", label: "Coughing", category: "Respiratory system", petTypes: ["Dog", "Cat", "Other"] },
  { id: "symp-fast-breathing", label: "Fast breathing at rest", category: "Respiratory system", petTypes: ["Dog", "Cat", "Bird", "Small Pet", "Other"] },
  { id: "symp-sneezing", label: "Frequent sneezing", category: "Respiratory system", petTypes: ["Dog", "Cat", "Bird", "Other"] },
  // Eye
  { id: "symp-eye-redness", label: "Red or watery eyes", category: "Eye problems", petTypes: ["Dog", "Cat", "Bird", "Other"] },
  { id: "symp-eye-discharge", label: "Thick eye discharge", category: "Eye problems", petTypes: ["Dog", "Cat", "Bird", "Other"] },
  { id: "symp-eye-cloudy", label: "Cloudy eye", category: "Eye problems", petTypes: ["Dog", "Cat", "Fish", "Other"] }
];

function assessSymptoms(symptomIds: string[]): SymptomAssessment | null {
  if (symptomIds.length === 0) return null;

  const hasConstipation = symptomIds.includes("symp-constipation");
  const hasVomiting = symptomIds.includes("symp-vomiting");
  const hasDiarrhea = symptomIds.includes("symp-diarrhea");
  const hasCoughing = symptomIds.includes("symp-coughing");
  const hasFastBreathing = symptomIds.includes("symp-fast-breathing");
  const hasEyeRedness = symptomIds.includes("symp-eye-redness");
  const hasEyeDischarge = symptomIds.includes("symp-eye-discharge");

  const mostLikely: string[] = [];
  const lessLikely: string[] = [];

  if (hasConstipation) {
    mostLikely.push("Dehydration or not enough water intake");
    mostLikely.push("Low-fiber diet or sudden diet change");
    lessLikely.push("Pain, arthritis, or stress leading to less movement");
  }

  if (hasVomiting || hasDiarrhea) {
    mostLikely.push("Dietary indiscretion (eating something unusual or spoiled)");
    mostLikely.push("Sudden change in food or treats");
    lessLikely.push("Viral or bacterial infection");
    lessLikely.push("Organ disease (liver, kidney, pancreas)");
  }

  if (hasCoughing || hasFastBreathing) {
    mostLikely.push("Mild respiratory irritation or recent excitement/exercise");
    lessLikely.push("Infection such as kennel cough or flu");
    lessLikely.push("Heart or lung disease requiring urgent vet care");
  }

  if (hasEyeRedness || hasEyeDischarge) {
    mostLikely.push("Mild conjunctivitis or irritation (dust, allergens, shampoo)");
    lessLikely.push("Corneal ulcer or injury to the eye");
    lessLikely.push("Chronic eye disease or blocked tear ducts");
  }

  const guidance =
    "This assessment is for educational purposes only and does not replace a physical examination by a veterinarian. " +
    "If symptoms are severe, sudden, or your pet seems very unwell, seek emergency veterinary care immediately.";

  return {
    mostLikely: Array.from(new Set(mostLikely)),
    lessLikely: Array.from(new Set(lessLikely)),
    guidance
  };
}

function getUrgencyLevel(symptomIds: string[]): {
  level: "Low" | "Moderate" | "High";
  style: string;
  action: string;
} {
  const hasFastBreathing = symptomIds.includes("symp-fast-breathing");
  const hasVomiting = symptomIds.includes("symp-vomiting");
  const hasDiarrhea = symptomIds.includes("symp-diarrhea");
  const hasEyeDischarge = symptomIds.includes("symp-eye-discharge");

  if (hasFastBreathing || (hasVomiting && hasDiarrhea)) {
    return {
      level: "High",
      style: "bg-red-100 text-red-900",
      action: "Contact a vet immediately or visit an emergency clinic if symptoms are severe or worsening."
    };
  }

  if (hasVomiting || hasDiarrhea || hasEyeDischarge) {
    return {
      level: "Moderate",
      style: "bg-amber-100 text-amber-900",
      action: "Monitor closely for 12-24 hours and book a vet consultation if symptoms persist."
    };
  }

  return {
    level: "Low",
    style: "bg-emerald-100 text-emerald-900",
    action: "Home monitoring is reasonable. Keep hydration and appetite checks consistent."
  };
}

function SymptomsInner() {
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory | "All">("Digestive system");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<SymptomAssessment | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPets = async () => {
      setIsLoading(true);
      try {
        const savedPets = await vaccineService.listPets();
        if (cancelled) return;

        const sourcePets = savedPets.length > 0 ? savedPets : mockPets;
        setPets(sourcePets);
        setSelectedPetId(sourcePets[0]?.id ?? "");
      } catch {
        if (cancelled) return;
        setPets(mockPets);
        setSelectedPetId(mockPets[0]?.id ?? "");
        toast.error("Unable to load saved pets. Showing sample pets.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPets();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) ?? pets[0],
    [pets, selectedPetId]
  );

  const filteredOptions = useMemo(
    () =>
      SYMPTOM_OPTIONS.filter((opt) =>
        (selectedCategory === "All" ? true : opt.category === selectedCategory) &&
        (selectedPet ? opt.petTypes.includes(selectedPet.type) || opt.petTypes.includes("All") : true)
      ),
    [selectedCategory, selectedPet]
  );

  useEffect(() => {
    setSelectedSymptoms((prev) => prev.filter((id) => filteredOptions.some((opt) => opt.id === id)));
    setAssessment(null);
  }, [selectedPet?.type, selectedCategory, filteredOptions]);

  const profileGuidance = useMemo(() => {
    if (!selectedPet) return null;

    const tips: string[] = [];
    if (selectedPet.type === "Dog") {
      tips.push("Monitor hydration and stool quality after activity-heavy days.");
    }
    if (selectedPet.type === "Cat") {
      tips.push("Track appetite and litter-box changes closely, as subtle signs matter.");
    }
    if (selectedPet.ageYears < 1) {
      tips.push("Young pets can dehydrate quickly. Seek advice early if symptoms persist.");
    }
    if (selectedPet.healthConditions?.length) {
      tips.push(`Known conditions: ${selectedPet.healthConditions.join(", ")}.`);
    }

    return tips.join(" ");
  }, [selectedPet]);

  const urgency = useMemo(() => getUrgencyLevel(selectedSymptoms), [selectedSymptoms]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center">
          <Loader label="Loading pet profiles..." />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Symptom checker</h1>
          <p className="mt-1 text-sm text-ink-700">
            Select symptoms to get possible causes and guidance. This does not replace a vet visit.
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700 shadow-soft">
          Triage level: <span className={"ml-1 rounded-full px-2 py-0.5 font-semibold " + urgency.style}>{urgency.level}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr,1.6fr]">
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Pet</h2>
              <p className="mt-1 text-xs text-ink-600">
                Choose which saved pet you are checking symptoms for.
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-ink-50 p-1 text-xs">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id)}
                  className={
                    "rounded-xl px-2 py-1 " +
                    (selectedPetId === pet.id
                      ? "bg-white text-ink-900 shadow-soft"
                      : "text-ink-700 hover:bg-ink-100")
                  }
                >
                  {pet.name}
                </button>
              ))}
            </div>
            {selectedPet ? (
              <div className="space-y-1">
                <p className="text-xs text-ink-600">
                  {selectedPet.name} • {selectedPet.type} • {selectedPet.breed} • {selectedPet.ageYears} years
                </p>
                {profileGuidance ? <p className="text-[11px] text-ink-600">{profileGuidance}</p> : null}
                <p className="text-[11px] text-brand-700">
                  Symptom list is tailored for {selectedPet.type.toLowerCase()} care.
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-ink-900">Symptom category</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {(["All", "Digestive system", "Respiratory system", "Eye problems"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat as any)}
                    className={
                      "rounded-full px-3 py-1 " +
                      (selectedCategory === cat
                        ? "bg-brand-100 text-brand-900"
                        : "bg-ink-50 text-ink-700 hover:bg-ink-100")
                    }
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-ink-900">Select symptoms</h2>
            <div className="mt-1 grid gap-2 text-xs md:grid-cols-2">
              {filteredOptions.map((opt) => {
                const checked = selectedSymptoms.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 hover:bg-ink-100"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedSymptoms((prev) =>
                          checked ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                        )
                      }
                      className="h-4 w-4 rounded border-ink-300 text-brand-600"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-ink-600">
              This checker is a starting point only. Always contact your veterinarian if you are
              unsure.
            </p>
          </div>

          <Button
            size="md"
            onClick={() => {
              setAssessment(assessSymptoms(selectedSymptoms));
            }}
            disabled={selectedSymptoms.length === 0}
          >
            Generate assessment
          </Button>
          <Button
            size="md"
            variant="ghost"
            onClick={() => {
              setSelectedSymptoms([]);
              setAssessment(null);
            }}
          >
            Reset symptoms
          </Button>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-900">Assessment</h2>
          {assessment ? (
            <>
              <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-xs text-ink-800">
                <p className="font-semibold">Recommended next step</p>
                <p className="mt-1">{urgency.action}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-800">Most likely causes</p>
                <ul className="mt-2 list-disc pl-5 text-xs text-ink-700">
                  {assessment.mostLikely.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {assessment.lessLikely.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-ink-800">Less likely causes</p>
                  <ul className="mt-2 list-disc pl-5 text-xs text-ink-700">
                    {assessment.lessLikely.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[11px] text-amber-900">
                {assessment.guidance}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-600">
              Select at least one symptom and click &quot;Generate assessment&quot; to see
              possible causes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SymptomsPage() {
  return (
    <ProtectedRoute>
      <SymptomsInner />
    </ProtectedRoute>
  );
}

