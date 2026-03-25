"use client";

import type { PetProfile } from "@/utils/types";

export function PetCard({ pet }: { pet: PetProfile }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft">
      <p className="text-base font-semibold text-ink-900">{pet.name}</p>
      <p className="mt-1 text-sm text-ink-700">
        {pet.type} • {pet.breed}
      </p>
      <p className="mt-1 text-sm text-ink-600">{pet.ageYears} years</p>
    </div>
  );
}

