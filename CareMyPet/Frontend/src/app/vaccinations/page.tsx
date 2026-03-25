"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { vaccineService } from "@/services/vaccineService";
import type { PetProfile, VaccineScheduleItem } from "@/utils/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";

// ─── Reference data ─────────────────────────────────────────────────────────

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Fish"] as const;
type PetTypeKey = (typeof PET_TYPES)[number];

const BREED_OPTIONS: Record<PetTypeKey, string[]> = {
  Dog: [
    "Labrador Retriever",
    "German Shepherd",
    "Golden Retriever",
    "Poodle",
    "Beagle",
    "Rottweiler",
    "Shih Tzu",
    "Pomeranian",
    "Mixed"
  ],
  Cat: [
    "Persian",
    "Siamese",
    "Maine Coon",
    "Ragdoll",
    "Bengal",
    "British Shorthair",
    "Sphynx",
    "Mixed"
  ],
  Bird: ["Parrot", "Cockatiel", "Canary", "Budgerigar", "Lovebird", "Macaw", "Other"],
  Rabbit: ["Holland Lop", "Mini Rex", "Lionhead", "Dutch", "Angora", "Mixed"],
  Fish: ["Goldfish", "Betta", "Guppy", "Angelfish", "Molly", "Other"]
};

const BREED_VACCINE_EXTRAS: Partial<Record<PetTypeKey, Record<string, string[]>>> = {
  Dog: {
    "German Shepherd": ["Canine Coronavirus"],
    "Labrador Retriever": ["Giardia"],
    "Golden Retriever": ["Canine Coronavirus"],
    "Shih Tzu": ["Bordetella booster"]
  },
  Cat: {
    Persian: ["Chlamydia felis"],
    Siamese: ["Chlamydia felis"],
    Bengal: ["Bordetella (Feline)"],
    Sphynx: ["Dermatophytosis (Ringworm) vaccine guidance"]
  },
  Bird: {
    Parrot: ["PBFD (Psittacine Beak and Feather Disease) advisory"],
    Cockatiel: ["PBFD (Psittacine Beak and Feather Disease) advisory"]
  },
  Rabbit: {
    Angora: ["Pasteurella multocida risk guidance"]
  }
};

function normalizePetType(rawType: string | undefined): PetTypeKey | null {
  if (!rawType) return null;
  const value = rawType.trim().toLowerCase();
  if (value === "dog") return "Dog";
  if (value === "cat") return "Cat";
  if (value === "bird") return "Bird";
  if (value === "rabbit" || value === "small pet" || value === "small_pet") return "Rabbit";
  if (value === "fish") return "Fish";
  return null;
}

const VACCINE_GUIDE: Record<PetTypeKey, Array<{ name: string; ageRange: string; frequency: string; notes: string }>> = {
  Dog: [
    { name: "Rabies", ageRange: "12–16 weeks, then annually", frequency: "Annual or 3-yearly booster", notes: "Core. Legally required in most regions." },
    { name: "DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)", ageRange: "6–8 weeks; boosters at 10–12 and 14–16 weeks", frequency: "Every 3 years after initial series", notes: "Core combo vaccine protecting against 4 serious diseases." },
    { name: "Bordetella (Kennel Cough)", ageRange: "8 weeks+", frequency: "Every 6–12 months", notes: "Recommended for dogs in contact with other dogs, kennels, or dog parks." },
    { name: "Leptospirosis", ageRange: "12 weeks+", frequency: "Annual", notes: "Recommended in wet/endemic areas or for outdoor dogs." },
    { name: "Lyme Disease", ageRange: "12 weeks+", frequency: "Annual (tick-prone areas)", notes: "Non-core. Discuss with vet based on environment." },
    { name: "Canine Influenza (H3N2 / H3N8)", ageRange: "8 weeks+", frequency: "Annual if at risk", notes: "Recommended for dogs frequently in kennels, groomers, or dog parks." },
  ],
  Cat: [
    { name: "FVRCP (Rhinotracheitis, Calicivirus, Panleukopenia)", ageRange: "6–8 weeks; boosters until 16 weeks", frequency: "Every 3 years after initial series", notes: "Core combo for all cats." },
    { name: "Rabies", ageRange: "12–16 weeks", frequency: "Annual or 3-yearly", notes: "Core. Required in most regions." },
    { name: "FeLV (Feline Leukemia)", ageRange: "8–12 weeks; 2-dose series", frequency: "Annual for outdoor or multi-cat households", notes: "Recommended for cats with outdoor access." },
    { name: "FIV (Feline Immunodeficiency Virus)", ageRange: "8 weeks+", frequency: "Initial series, then annually", notes: "Non-core. Discuss risk level with vet." },
  ],
  Bird: [
    { name: "Polyomavirus", ageRange: "4–6 weeks (chicks)", frequency: "Annual booster", notes: "Critical for budgies, cockatiels, and lovebirds." },
    { name: "Pacheco's Disease (Herpesvirus)", ageRange: "Any age", frequency: "Annual", notes: "Recommended for birds in contact with others or in shows." },
  ],
  Rabbit: [
    { name: "RHDV2 (Rabbit Hemorrhagic Disease Virus 2)", ageRange: "5 weeks+", frequency: "Annual", notes: "Core. Highly fatal. Critical for all pet rabbits." },
    { name: "Myxomatosis", ageRange: "5 weeks+", frequency: "Annual (every 6 months in high-risk areas)", notes: "Core in Europe & Australia. Check regional availability." },
  ],
  Fish: [],
};

const GROOMING_GUIDE: Record<PetTypeKey, Array<{ task: string; frequency: string; tips: string }>> = {
  Dog: [
    { task: "Brushing", frequency: "Short coat: weekly · Long/double coat: 3–4× per week", tips: "Use a slicker brush for tangles. Always brush before bathing to avoid matting." },
    { task: "Bathing", frequency: "Every 4–6 weeks (or when dirty)", tips: "Use dog-specific shampoo. Rinse thoroughly. Dry ears fully after bath." },
    { task: "Nail trimming", frequency: "Every 3–4 weeks", tips: "Avoid the quick (pink area). Use proper dog nail clippers. Press paw gently to extend nail." },
    { task: "Ear cleaning", frequency: "Every 2–4 weeks", tips: "Use vet-approved solution. Never insert cotton swabs deep into the canal." },
    { task: "Teeth brushing", frequency: "2–3× per week (daily is ideal)", tips: "Use dog-safe toothpaste — never human toothpaste. Build habit with a finger brush." },
    { task: "Eye cleaning", frequency: "Weekly or as needed", tips: "Wipe discharge gently with a damp cloth. Persistent discharge warrants a vet visit." },
  ],
  Cat: [
    { task: "Brushing", frequency: "Short coat: weekly · Long coat: daily", tips: "Reduces hairballs and shedding. Start short sessions and gradually build tolerance." },
    { task: "Nail trimming", frequency: "Every 2–3 weeks", tips: "Use cat nail clippers. Trim only the sharp tip. Positive reinforcement helps anxious cats." },
    { task: "Ear cleaning", frequency: "Monthly or when visibly dirty", tips: "Use cotton ball with ear cleaning solution. Healthy ears are pink and odor-free." },
    { task: "Teeth brushing", frequency: "2–3× per week", tips: "Use cat-specific toothpaste. Dental disease is common — start early." },
    { task: "Bathing", frequency: "Only when necessary", tips: "Use cat-formulated shampoo, lukewarm water. Keep it calm and brief; most cats self-groom." },
  ],
  Bird: [
    { task: "Feather misting", frequency: "2–3× per week", tips: "Use a clean spray bottle with lukewarm water. Encourages preening and feather health." },
    { task: "Nail trimming", frequency: "Every 4–6 weeks", tips: "Clip only the hook tip. Vet assistance is recommended for first-timers." },
    { task: "Beak inspection", frequency: "Monthly", tips: "Healthy beak is smooth and aligned. Overgrowth or irregularities need a vet evaluation." },
    { task: "Cage cleaning", frequency: "Tray: daily · Full clean: weekly", tips: "Bird droppings carry bacteria. Regularly clean perches, toys, and food/water bowls." },
  ],
  Rabbit: [
    { task: "Brushing", frequency: "Short coat: weekly · Long (Angora) coat: daily", tips: "Prevents wool block — a potentially fatal hairball obstruction unique to rabbits." },
    { task: "Nail trimming", frequency: "Every 4–6 weeks", tips: "Wrap rabbit in a towel to minimize movement. Use proper rabbit clippers." },
    { task: "Ear cleaning", frequency: "Monthly or as needed", tips: "Check for dark wax or head-shaking — signs of ear mites. Use vet-approved solution only." },
    { task: "Scent gland cleaning", frequency: "Every 1–3 months", tips: "Scent glands near the tail need occasional cleaning. Vet demonstration is recommended initially." },
  ],
  Fish: [
    { task: "Water change", frequency: "25–30% weekly", tips: "Use a water conditioner to neutralize chlorine. Match new water temperature to tank water." },
    { task: "Filter cleaning", frequency: "Monthly (never fully replace media)", tips: "Rinse filter media in old tank water to preserve beneficial bacteria." },
    { task: "Algae wiping", frequency: "Weekly", tips: "Use a magnetic algae cleaner. Some algae is healthy — remove excessive buildup only." },
  ],
};

const MEDICINE_GUIDE: Record<PetTypeKey, Array<{ name: string; schedule: string; purpose: string; notes: string }>> = {
  Dog: [
    { name: "Heartworm prevention", schedule: "Monthly — year-round", purpose: "Prevents heartworm disease transmitted by mosquitoes", notes: "Requires annual heartworm test before prescribing. Available as chewable tablets or topical." },
    { name: "Flea & Tick prevention", schedule: "Monthly or bi-monthly", purpose: "Prevents flea infestation and tick-borne diseases (Lyme, Ehrlichia)", notes: "Oral options last 1–3 months. Topicals should be applied to skin, not fur." },
    { name: "Deworming", schedule: "Puppies: every 2 weeks until 12 wks, then monthly to 6 months · Adults: every 3–6 months", purpose: "Controls roundworms, tapeworms, hookworms, whipworms", notes: "Routine stool checks help identify which parasites are present." },
    { name: "Joint supplement (Glucosamine / Chondroitin)", schedule: "Daily — senior or large-breed dogs", purpose: "Supports joint health; reduces arthritis pain", notes: "Especially important for Labradors, German Shepherds, Golden Retrievers aged 6+." },
  ],
  Cat: [
    { name: "Flea & Tick prevention", schedule: "Monthly", purpose: "Prevents flea anemia and tapeworm transmission via fleas", notes: "Never use dog-formulated products on cats — some are severely toxic. Use Revolution, Advantage, or vet-prescribed products." },
    { name: "Deworming", schedule: "Kittens: every 2 weeks until 8 wks, then monthly to 6 months · Adults: every 3–6 months", purpose: "Controls roundworms, hookworms, tapeworms", notes: "Annual stool check recommended. Outdoor cats need more frequent treatment." },
    { name: "Hairball remedy", schedule: "2–3× per week or as needed", purpose: "Facilitates passage of swallowed hair", notes: "Petroleum-based gels or high-fiber food can help. Frequent hairballs may suggest over-grooming." },
  ],
  Bird: [
    { name: "Mite / Parasite treatment", schedule: "As prescribed by avian vet", purpose: "Controls feather mites, air-sac mites, lice", notes: "Ivermectin-based products used. Dosage is weight-sensitive — always vet-guided." },
    { name: "Calcium / Cuttlebone", schedule: "Continuous availability in cage", purpose: "Supports beak, bone health, and egg-laying females", notes: "Water-soluble calcium drops can supplement if the bird ignores the cuttlebone." },
  ],
  Rabbit: [
    { name: "Flea & Mite prevention", schedule: "Monthly if at risk", purpose: "Treats ear mites, fur mites, and fleas", notes: "Use only rabbit-safe products (Revolution for rabbits). Never use permethrin — it is toxic to rabbits." },
    { name: "Gut motility support", schedule: "As needed during illness or stress", purpose: "Stimulates GI movement; prevents deadly GI stasis", notes: "GI stasis is a medical emergency in rabbits. Unlimited hay is the #1 prevention strategy." },
  ],
  Fish: [
    { name: "Antiparasitic (Ich treatment)", schedule: "As needed when white spots appear", purpose: "Treats white spot disease (Ichthyophthirius)", notes: "Raise tank temperature to 28 °C, add aquarium salt or copper-based treatment. Quarantine affected fish." },
    { name: "Antibacterial treatment", schedule: "As needed for fin rot, pop-eye", purpose: "Treats bacterial infections", notes: "Use aquarium antibiotics carefully. Remove carbon filters during treatment." },
  ],
};

const SIDE_EFFECTS: Array<{ effect: string; description: string; severity: "mild" | "moderate" | "urgent" }> = [
  { effect: "Soreness or swelling at injection site", description: "Common and normal. Usually resolves within 1–3 days. Keep your pet rested and avoid vigorous activity the day of vaccination.", severity: "mild" },
  { effect: "Lethargy or tiredness", description: "Your pet may seem quiet or sleepy for 12–24 hours. This is the immune system working — completely normal and expected.", severity: "mild" },
  { effect: "Mild low-grade fever", description: "A slight temperature rise within 24 hours signals immune activation. Monitor comfort and provide water; typically resolves on its own.", severity: "mild" },
  { effect: "Reduced appetite", description: "Mild appetite loss for up to 24 hours is normal. Offer water and light food. If it continues past 48 hours, contact your vet.", severity: "mild" },
  { effect: "Sneezing or nasal discharge", description: "Expected after intranasal vaccines (Bordetella, FeLV). Typically resolves within 2–4 days.", severity: "mild" },
  { effect: "Facial swelling or hives", description: "May indicate a mild allergic reaction. Contact your vet promptly if it develops within an hour of vaccination. It is treatable with antihistamines.", severity: "moderate" },
  { effect: "Vomiting or diarrhea", description: "Occasional mild gastrointestinal upset may occur. Keep your pet hydrated. Seek veterinary care if it continues beyond 24 hours.", severity: "moderate" },
  { effect: "Persistent limping or joint pain", description: "Some live vaccines can cause transient joint discomfort. If it lasts beyond 48 hours or worsens, a vet check is recommended.", severity: "moderate" },
  { effect: "Severe allergic reaction (Anaphylaxis)", description: "Rare but urgent. Signs: collapse, difficulty breathing, extreme facial swelling, pale gums — within minutes of vaccination. Go to an emergency vet immediately.", severity: "urgent" },
];

const SEVERITY_STYLE: Record<"mild" | "moderate" | "urgent", { badge: string; border: string; bg: string; text: string }> = {
  mild: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    border: "border-emerald-200 dark:border-emerald-900/45",
    bg: "bg-white dark:bg-emerald-950/15",
    text: "text-ink-700"
  },
  moderate: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-900/45",
    bg: "bg-amber-50 dark:bg-amber-950/15",
    text: "text-ink-800 dark:text-ink-700"
  },
  urgent: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    border: "border-red-200 dark:border-red-900/45",
    bg: "bg-red-50 dark:bg-red-950/20",
    text: "text-red-900 dark:text-red-200"
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getDaysRemaining(dueDateIso: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDateIso));
  return Math.round((due.getTime() - today.getTime()) / DAY_MS);
}

function getUrgencyStyle(daysRemaining: number): {
  card: string;
  chip: string;
  ring: string;
  title: string;
  badgeText: string;
} {
  if (daysRemaining < 0) {
    return {
      card: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200",
      chip: "bg-red-600 text-white",
      ring: "ring-2 ring-red-200",
      title: "Overdue",
      badgeText: `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} overdue`,
    };
  }

  if (daysRemaining === 0) {
    return {
      card: "bg-gradient-to-r from-red-100 to-orange-100 border-red-300",
      chip: "bg-red-700 text-white animate-pulse",
      ring: "ring-2 ring-red-300",
      title: "Due today",
      badgeText: "Due today",
    };
  }

  if (daysRemaining <= 3) {
    return {
      card: "bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300",
      chip: "bg-orange-600 text-white",
      ring: "ring-2 ring-orange-200",
      title: "Due soon",
      badgeText: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`,
    };
  }

  return {
    card: "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200",
    chip: "bg-emerald-600 text-white",
    ring: "",
    title: "Scheduled",
    badgeText: `${daysRemaining} days remaining`,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VaccinationsPage() {
  return (
    <ProtectedRoute>
      <VaccinationsInner />
    </ProtectedRoute>
  );
}

function VaccinationsInner() {
  const searchParams = useSearchParams();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [schedule, setSchedule] = useState<VaccineScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedVaccineId, setFocusedVaccineId] = useState<string>("");
  const [highlightedVaccineId, setHighlightedVaccineId] = useState<string>("");

  const focusPetId = searchParams.get("petId") || "";
  const focusVaccineId = searchParams.get("focusVaccineId") || "";

  const [newPet, setNewPet] = useState<Omit<PetProfile, "id">>({
    name: "",
    type: "Dog",
    ageYears: 1,
    breed: ""
  });
  const [editingPetId, setEditingPetId] = useState<string>("");
  const [editPet, setEditPet] = useState<Omit<PetProfile, "id">>({
    name: "",
    type: "Dog",
    ageYears: 1,
    breed: ""
  });
  const [newVaccine, setNewVaccine] = useState<{ vaccineName: string; dueDateIso: string }>({
    vaccineName: "",
    dueDateIso: ""
  });
  const [editingVaccineId, setEditingVaccineId] = useState<string>("");
  const [editVaccine, setEditVaccine] = useState<{ vaccineName: string; dueDateIso: string; status: "Pending" | "Done" }>({
    vaccineName: "",
    dueDateIso: "",
    status: "Pending",
  });
  const [guideType, setGuideType] = useState<PetTypeKey>("Dog");
  const [activeGuideTab, setActiveGuideTab] = useState<"vaccines" | "grooming" | "medicines" | "sideeffects">("vaccines");
  const selectedPet = useMemo(() => pets.find((p) => p.id === selectedPetId), [pets, selectedPetId]);

  const newPetType = (newPet.type as PetTypeKey) || "Dog";
  const newPetBreedOptions = BREED_OPTIONS[newPetType] ?? [];

  useEffect(() => {
    (async () => {
      try {
        const petList = await vaccineService.listPets();
        setPets(petList);
        const initialPet =
          petList.find((pet) => pet.id === focusPetId) || petList[0] || null;

        if (initialPet) {
          setSelectedPetId(initialPet.id);
          const firstType = normalizePetType(initialPet.type);
          if (firstType) setGuideType(firstType);
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load pets");
      } finally {
        setLoading(false);
      }
    })();
  }, [focusPetId]);

  useEffect(() => {
    if (!focusVaccineId) return;
    setFocusedVaccineId(focusVaccineId);
  }, [focusVaccineId]);

  useEffect(() => {
    if (!focusPetId || pets.length === 0) return;
    const requestedPet = pets.find((pet) => pet.id === focusPetId);
    if (!requestedPet) return;
    if (selectedPetId !== requestedPet.id) {
      setSelectedPetId(requestedPet.id);
    }
  }, [focusPetId, pets, selectedPetId]);

  useEffect(() => {
    if (!selectedPetId) return;
    (async () => {
      try {
        const items = await vaccineService.listSchedule(selectedPetId);
        setSchedule(items);
      } catch {
        setSchedule([]);
      }
    })();
  }, [selectedPetId]);

  useEffect(() => {
    if (!focusedVaccineId || schedule.length === 0) return;
    const exists = schedule.some((item) => item.id === focusedVaccineId);
    if (!exists) return;

    const timer = window.setTimeout(() => {
      const target = document.getElementById(`vaccine-item-${focusedVaccineId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      setHighlightedVaccineId(focusedVaccineId);
      window.setTimeout(() => {
        setHighlightedVaccineId((current) => (current === focusedVaccineId ? "" : current));
      }, 2800);
      setFocusedVaccineId("");
    }, 150);

    return () => window.clearTimeout(timer);
  }, [focusedVaccineId, schedule]);

  const upcoming = useMemo(
    () => schedule.filter((s) => s.status === "Pending"),
    [schedule]
  );

  const completed = useMemo(
    () => schedule.filter((s) => s.status === "Done"),
    [schedule]
  );

  const upcomingSorted = useMemo(() => {
    return [...upcoming].sort((a, b) => getDaysRemaining(a.dueDateIso) - getDaysRemaining(b.dueDateIso));
  }, [upcoming]);

  const nextDue = useMemo(() => {
    if (upcomingSorted.length === 0) return null;
    const candidate = upcomingSorted[0];
    return {
      ...candidate,
      daysRemaining: getDaysRemaining(candidate.dueDateIso),
    };
  }, [upcomingSorted]);

  const vaccineDropdownType = useMemo<PetTypeKey | null>(() => {
    const selectedType = normalizePetType(selectedPet?.type);
    if (selectedType) return selectedType;
    return null;
  }, [selectedPet]);

  const vaccineNameOptions = useMemo(() => {
    if (!vaccineDropdownType || !selectedPet) return [];
    const baseNames = VACCINE_GUIDE[vaccineDropdownType].map((v) => v.name);
    const selectedBreed = selectedPet?.breed ?? "";
    const breedExtras = BREED_VACCINE_EXTRAS[vaccineDropdownType]?.[selectedBreed] ?? [];
    return Array.from(new Set([...baseNames, ...breedExtras]));
  }, [vaccineDropdownType, selectedPet]);

  useEffect(() => {
    setNewVaccine((prev) => {
      if (!prev.vaccineName) return prev;
      return vaccineNameOptions.includes(prev.vaccineName)
        ? prev
        : { ...prev, vaccineName: "" };
    });
  }, [vaccineNameOptions]);

  async function addPet() {
    if (!newPet.name.trim() || !newPet.breed.trim()) {
      toast.error("Please enter pet name, pet type, and breed.");
      return;
    }
    try {
      const created = await vaccineService.createPet(newPet);
      setPets((prev) => [...prev, created]);
      setSelectedPetId(created.id);
      setNewPet({ name: "", type: "Dog", ageYears: 1, breed: "" });
      toast.success("Pet added");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to add pet");
    }
  }

  async function addVaccine() {
    if (!selectedPetId || !newVaccine.vaccineName.trim() || !newVaccine.dueDateIso) return;
    try {
      const created = await vaccineService.addScheduleItem({
        petId: selectedPetId,
        vaccineName: newVaccine.vaccineName,
        dueDateIso: newVaccine.dueDateIso,
        status: "Pending"
      });
      setSchedule((prev) => [...prev, created]);
      setNewVaccine({ vaccineName: "", dueDateIso: "" });
      toast.success("Vaccine scheduled");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to schedule vaccine");
    }
  }

  function startEditPet(pet: PetProfile) {
    setEditingPetId(pet.id);
    setEditPet({
      name: pet.name,
      type: pet.type,
      ageYears: pet.ageYears,
      breed: pet.breed,
      gender: pet.gender,
      weightKg: pet.weightKg,
      photoUrl: pet.photoUrl,
      healthConditions: pet.healthConditions,
    });
  }

  async function savePetEdits() {
    if (!editingPetId) return;
    if (!editPet.name.trim() || !editPet.breed.trim()) {
      toast.error("Pet name and breed are required.");
      return;
    }

    try {
      const updated = await vaccineService.updatePet(editingPetId, {
        name: editPet.name,
        type: editPet.type,
        ageYears: editPet.ageYears,
        breed: editPet.breed,
      });
      setPets((prev) => prev.map((pet) => (pet.id === updated.id ? updated : pet)));
      if (selectedPetId === updated.id) {
        const t = normalizePetType(updated.type);
        if (t) setGuideType(t);
      }
      setEditingPetId("");
      toast.success("Pet updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update pet");
    }
  }

  async function removePet(petId: string) {
    const pet = pets.find((p) => p.id === petId);
    const label = pet ? `${pet.name}` : "this pet";
    if (!window.confirm(`Delete ${label} and all linked vaccine records?`)) {
      return;
    }

    try {
      await vaccineService.deletePet(petId);
      const nextPets = pets.filter((p) => p.id !== petId);
      setPets(nextPets);

      if (selectedPetId === petId) {
        const nextPetId = nextPets[0]?.id || "";
        setSelectedPetId(nextPetId);
        if (!nextPetId) {
          setSchedule([]);
        }
      }

      if (editingPetId === petId) {
        setEditingPetId("");
      }
      toast.success("Pet removed");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to remove pet");
    }
  }

  function startEditVaccine(item: VaccineScheduleItem) {
    setEditingVaccineId(item.id);
    setEditVaccine({
      vaccineName: item.vaccineName,
      dueDateIso: item.dueDateIso,
      status: item.status,
    });
  }

  async function saveVaccineEdits() {
    if (!editingVaccineId) return;
    if (!editVaccine.vaccineName.trim() || !editVaccine.dueDateIso) {
      toast.error("Vaccine name and due date are required.");
      return;
    }

    try {
      const updated = await vaccineService.updateScheduleItem(editingVaccineId, {
        vaccineName: editVaccine.vaccineName,
        dueDateIso: editVaccine.dueDateIso,
        status: editVaccine.status,
      });
      setSchedule((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingVaccineId("");
      toast.success("Vaccine updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update vaccine");
    }
  }

  async function removeVaccine(vaccineId: string) {
    if (!window.confirm("Delete this vaccine record?")) {
      return;
    }

    try {
      await vaccineService.deleteScheduleItem(vaccineId);
      setSchedule((prev) => prev.filter((item) => item.id !== vaccineId));
      if (editingVaccineId === vaccineId) {
        setEditingVaccineId("");
      }
      toast.success("Vaccine removed");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to remove vaccine");
    }
  }

  async function markDone(id: string) {
    try {
      const updated = await vaccineService.markDone(id);
      setSchedule((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update status");
    }
  }

  function handleSelectPet(petId: string) {
    setSelectedPetId(petId);
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      const t = normalizePetType(pet.type);
      if (t) setGuideType(t);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center">
          <Loader label="Loading vaccination data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 md:text-[2rem]">Vaccination tracker</h1>
      <p className="mt-1 text-sm text-ink-700">Add pets, manage vaccine schedule, and view upcoming doses.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <h2 className="text-sm font-semibold text-ink-900">Pets</h2>
            <div className="mt-3 space-y-2">
              {pets.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <button
                    className={`flex-1 rounded-xl px-3 py-2 text-left text-sm ${
                      p.id === selectedPetId ? "bg-ink-100 text-ink-900" : "bg-ink-50 text-ink-700"
                    }`}
                    onClick={() => handleSelectPet(p.id)}
                  >
                    {p.name} · {p.type}
                  </button>
                  <Button size="sm" variant="outline" onClick={() => startEditPet(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void removePet(p.id)}>
                    Remove
                  </Button>
                </div>
              ))}
              {pets.length === 0 ? <p className="text-xs text-ink-600">No pets yet.</p> : null}
            </div>

            {editingPetId ? (
              <div className="mt-4 space-y-3 rounded-xl border border-ink-200 bg-ink-50 p-3">
                <p className="text-xs font-semibold text-ink-800">Edit pet</p>
                <Input
                  label="Pet name"
                  value={editPet.name}
                  onChange={(e) => setEditPet((prev) => ({ ...prev, name: e.target.value }))}
                />
                <label className="text-xs font-medium text-ink-800">
                  <span className="mb-1 block">Pet type</span>
                  <select
                    value={editPet.type}
                    onChange={(e) =>
                      setEditPet((prev) => ({
                        ...prev,
                        type: e.target.value as PetProfile["type"],
                        breed: "",
                      }))
                    }
                    title="Edit pet type"
                    aria-label="Edit pet type"
                    className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-ink-400"
                  >
                    {PET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-ink-800">
                  <span className="mb-1 block">Breed</span>
                  <select
                    value={editPet.breed || ""}
                    onChange={(e) => setEditPet((prev) => ({ ...prev, breed: e.target.value }))}
                    title="Edit breed"
                    aria-label="Edit breed"
                    className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-ink-400"
                  >
                    <option value="">Select breed</option>
                    {(BREED_OPTIONS[(editPet.type as PetTypeKey) || "Dog"] ?? []).map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Age (years)"
                  type="number"
                  min={0}
                  max={80}
                  value={String(editPet.ageYears ?? 0)}
                  onChange={(e) => {
                    const value = Number(e.target.value || 0);
                    setEditPet((prev) => ({ ...prev, ageYears: Number.isNaN(value) ? 0 : value }));
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => void savePetEdits()}>
                    Save changes
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => setEditingPetId("")}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
              <Input
                label="Pet name"
                value={newPet.name}
                onChange={(e) => setNewPet((p) => ({ ...p, name: e.target.value }))}
              />
              <label className="text-xs font-medium text-ink-800">
                <span className="mb-1 block">Pet type</span>
                <select
                  value={newPet.type}
                  onChange={(e) =>
                    setNewPet((p) => ({
                      ...p,
                      type: e.target.value as PetProfile["type"],
                      breed: ""
                    }))
                  }
                  title="Pet type"
                  aria-label="Pet type"
                  className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-ink-400"
                >
                  {PET_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-ink-800">
                <span className="mb-1 block">Breed</span>
                <select
                  value={newPet.breed}
                  onChange={(e) => setNewPet((p) => ({ ...p, breed: e.target.value }))}
                  title="Breed"
                  aria-label="Breed"
                  className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-ink-400"
                >
                  <option value="">Select breed</option>
                  {newPetBreedOptions.map((breed) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
              </label>
              <Button className="w-full" onClick={() => void addPet()}>
                Add pet
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6 md:col-span-2">
          {nextDue ? (
            <div className="rounded-[1.25rem] border border-red-200 bg-gradient-to-r from-red-100 via-orange-100 to-amber-100 p-5 shadow-soft dark:border-red-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-900">Vaccination alert</p>
              <h2 className="mt-1 text-lg font-bold text-red-950">
                {nextDue.vaccineName} for {selectedPet?.name || "your pet"}
              </h2>
              <p className="mt-1 text-sm font-medium text-red-900">
                {nextDue.daysRemaining < 0
                  ? `${Math.abs(nextDue.daysRemaining)} day${Math.abs(nextDue.daysRemaining) === 1 ? "" : "s"} overdue`
                  : nextDue.daysRemaining === 0
                    ? "Due today"
                    : `${nextDue.daysRemaining} day${nextDue.daysRemaining === 1 ? "" : "s"} remaining`}
                {" · "}
                {new Date(nextDue.dueDateIso).toLocaleDateString()}
              </p>
            </div>
          ) : null}

          <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <h2 className="text-sm font-semibold text-ink-900">Upcoming vaccines</h2>
            <div className="mt-3 space-y-2 text-sm">
              {upcomingSorted.map((v) => {
                const daysRemaining = getDaysRemaining(v.dueDateIso);
                const urgency = getUrgencyStyle(daysRemaining);
                return (
                <div
                  key={v.id}
                  id={`vaccine-item-${v.id}`}
                  className={`flex items-center justify-between rounded-xl border px-3 py-3 transition-all ${urgency.card} ${urgency.ring} ${
                    highlightedVaccineId === v.id ? "ring-4 ring-brand-300 shadow-soft" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{v.vaccineName}</p>
                    <p className="mt-0.5 text-xs text-ink-700">{urgency.title} · {new Date(v.dueDateIso).toLocaleDateString()}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgency.chip}`}>
                      {urgency.badgeText}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEditVaccine(v)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void removeVaccine(v.id)}>
                      Remove
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => void markDone(v.id)}>
                      Mark done
                    </Button>
                  </div>
                </div>
              );
              })}
              {upcoming.length === 0 ? (
                <p className="text-xs text-ink-600">No upcoming vaccines.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <h2 className="text-sm font-semibold text-ink-900">Completed vaccines</h2>
            <div className="mt-3 space-y-2 text-sm">
              {completed.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                      ✓
                    </span>
                    <span>
                      {v.vaccineName} · {new Date(v.dueDateIso).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-emerald-700">Done</span>
                </div>
              ))}
              {completed.length === 0 ? (
                <p className="text-xs text-ink-600">No completed vaccines yet.</p>
              ) : null}
            </div>
          </div>

          {editingVaccineId ? (
            <div className="rounded-[1.25rem] border border-ink-200/80 bg-ink-50 p-5 shadow-soft dark:border-ink-300/70 dark:bg-ink-100">
              <h2 className="text-sm font-semibold text-ink-900">Edit vaccine record</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <Input
                  label="Vaccine name"
                  value={editVaccine.vaccineName}
                  onChange={(e) => setEditVaccine((prev) => ({ ...prev, vaccineName: e.target.value }))}
                />
                <Input
                  label="Due date"
                  type="date"
                  value={editVaccine.dueDateIso}
                  onChange={(e) => setEditVaccine((prev) => ({ ...prev, dueDateIso: e.target.value }))}
                />
                <label className="text-xs font-medium text-ink-800">
                  <span className="mb-1 block">Status</span>
                  <select
                    value={editVaccine.status}
                    onChange={(e) =>
                      setEditVaccine((prev) => ({ ...prev, status: e.target.value as "Pending" | "Done" }))
                    }
                    className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-ink-400"
                    title="Vaccine status"
                    aria-label="Vaccine status"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => void saveVaccineEdits()}>
                  Save changes
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingVaccineId("")}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.25rem] border border-ink-100/70 bg-white p-5 shadow-soft dark:border-ink-200 dark:bg-ink-100">
            <h2 className="text-sm font-semibold text-ink-900">Add to schedule</h2>
            <p className="mt-1 text-xs text-ink-600">
              Scheduling for: {selectedPet ? `${selectedPet.name} (${selectedPet.type})` : "Select a pet first"}
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <label className="text-xs font-medium text-ink-800">
                <span className="mb-1 block">Vaccine name</span>
                <select
                  value={newVaccine.vaccineName}
                  onChange={(e) => setNewVaccine((v) => ({ ...v, vaccineName: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-ink-400"
                  title="Vaccine name"
                  aria-label="Vaccine name"
                  disabled={!selectedPet || vaccineNameOptions.length === 0}
                >
                  <option value="">
                    {!selectedPet
                      ? "Select a pet first"
                      : vaccineNameOptions.length > 0
                        ? `Select ${vaccineDropdownType}${selectedPet?.breed ? ` (${selectedPet.breed})` : ""} vaccine`
                        : `No listed vaccines for ${selectedPet.type}`}
                  </option>
                  {vaccineNameOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Due date"
                type="date"
                value={newVaccine.dueDateIso}
                onChange={(e) => setNewVaccine((v) => ({ ...v, dueDateIso: e.target.value }))}
              />
              <div className="flex items-end">
                <Button className="w-full" onClick={() => void addVaccine()}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comprehensive Pet Health Reference Guide ───────────────────── */}
      <div className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Pet health reference guide</h2>
            <p className="mt-1 text-xs text-ink-600">
              Vaccines, grooming, medicines, and side-effect info — filtered by your pet type.
            </p>
          </div>
          {/* Pet type selector */}
          <div className="inline-flex flex-wrap gap-1 rounded-xl bg-ink-50 p-1 text-xs">
            {PET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setGuideType(type)}
                className={"rounded-lg px-3 py-1.5 font-medium transition " + (guideType === type ? "bg-white text-ink-900 shadow-soft" : "text-ink-600 hover:bg-ink-100")}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-50 p-1 text-xs">
          {([
            { key: "vaccines", label: "Vaccines" },
            { key: "grooming", label: "Grooming schedule" },
            { key: "medicines", label: "Medicine & parasite control" },
            { key: "sideeffects", label: "Side effects" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveGuideTab(tab.key)}
              className={"whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition " + (activeGuideTab === tab.key ? "bg-white text-ink-900 shadow-soft" : "text-ink-600 hover:bg-ink-100")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Vaccines tab ── */}
        {activeGuideTab === "vaccines" && (
          <div className="mt-4">
            <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
              <span className="font-semibold">Note:</span> These are standard recommendations. Actual schedules may vary by region, lifestyle, and individual health. Always confirm with your veterinarian.
            </div>
            {(VACCINE_GUIDE[guideType] ?? []).length === 0 ? (
              <p className="rounded-xl border border-ink-100/70 bg-white px-4 py-6 text-center text-xs text-ink-500 shadow-soft dark:border-ink-200/70 dark:bg-ink-100">No specific vaccine data recorded for this pet type. Consult your vet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {VACCINE_GUIDE[guideType].map((v) => (
                  <div key={v.name} className="rounded-[1.1rem] border border-ink-100/80 bg-white p-4 shadow-soft dark:border-ink-200 dark:bg-ink-100">
                    <p className="text-sm font-semibold text-ink-900">{v.name}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p><span className="font-medium text-ink-700">Age range:</span> <span className="text-ink-600">{v.ageRange}</span></p>
                      <p><span className="font-medium text-ink-700">Frequency:</span> <span className="text-ink-600">{v.frequency}</span></p>
                      <p className="mt-1 rounded-lg bg-ink-50 px-2 py-1 text-ink-600">{v.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Grooming tab ── */}
        {activeGuideTab === "grooming" && (
          <div className="mt-4">
            <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
              <span className="font-semibold">Tip:</span> Regular grooming prevents skin issues, infections, and discomfort. Build a routine early so your pet is comfortable with handling.
            </div>
            {(GROOMING_GUIDE[guideType] ?? []).length === 0 ? (
              <p className="rounded-xl border border-ink-100/70 bg-white px-4 py-6 text-center text-xs text-ink-500 shadow-soft dark:border-ink-200/70 dark:bg-ink-100">No grooming data recorded for this pet type.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {GROOMING_GUIDE[guideType].map((g) => (
                  <div key={g.task} className="rounded-[1.1rem] border border-ink-100/80 bg-white p-4 shadow-soft dark:border-ink-200 dark:bg-ink-100">
                    <p className="text-sm font-semibold text-ink-900">{g.task}</p>
                    <p className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">{g.frequency}</p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-600">{g.tips}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Medicines tab ── */}
        {activeGuideTab === "medicines" && (
          <div className="mt-4">
            <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <span className="font-semibold">Important:</span> Never administer any medication without veterinary guidance. Doses, brands, and intervals can vary significantly by weight and health status.
            </div>
            {(MEDICINE_GUIDE[guideType] ?? []).length === 0 ? (
              <p className="rounded-xl border border-ink-100/70 bg-white px-4 py-6 text-center text-xs text-ink-500 shadow-soft dark:border-ink-200/70 dark:bg-ink-100">No medicine schedule data for this pet type.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {MEDICINE_GUIDE[guideType].map((m) => (
                  <div key={m.name} className="rounded-[1.1rem] border border-ink-100/80 bg-white p-4 shadow-soft dark:border-ink-200 dark:bg-ink-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-900">{m.name}</p>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{m.schedule}</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-700">{m.purpose}</p>
                    <p className="mt-2 rounded-lg bg-ink-50 px-2 py-1.5 text-xs text-ink-600">{m.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Side effects tab ── */}
        {activeGuideTab === "sideeffects" && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-blue-200/70 bg-[linear-gradient(125deg,rgba(232,244,255,0.95)_0%,rgba(248,252,255,0.96)_60%,rgba(235,247,255,0.95)_100%)] px-4 py-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-[linear-gradient(125deg,rgba(24,48,78,0.5)_0%,rgba(16,28,51,0.95)_60%,rgba(20,42,70,0.55)_100%)] dark:text-blue-100">
              <p className="font-semibold">No need to panic — most reactions are mild and short-lived.</p>
              <p className="mt-1">
                Side effects after vaccination are usually a sign the immune system is working. Most pets recover fully within 24–48 hours.
                The list below helps you understand what to watch for, when to monitor at home, and when to call a vet.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Green = Mild / expected</span>
              <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Yellow = Monitor closely</span>
              <span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">Red = Seek immediate vet care</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {SIDE_EFFECTS.map((se) => {
                const s = SEVERITY_STYLE[se.severity];
                return (
                  <div key={se.effect} className={`rounded-[1.1rem] border p-4 shadow-soft ${s.border} ${s.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={"text-sm font-semibold " + (se.severity === "urgent" ? "text-red-900" : "text-ink-900")}>{se.effect}</p>
                      <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize " + s.badge}>{se.severity}</span>
                    </div>
                    <p className={"mt-2 text-xs leading-relaxed " + s.text}>{se.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-4 text-xs text-ink-700 shadow-soft dark:border-ink-200 dark:bg-ink-100">
              <p className="font-semibold text-ink-900">When in doubt, call your vet</p>
              <p className="mt-1">If you are ever unsure whether a symptom is normal, contact your veterinarian. A quick call is always better than waiting when it comes to your pet&apos;s health.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

