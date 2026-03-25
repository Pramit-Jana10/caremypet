"use client";

import { useEffect, useState } from "react";
import { VetCard } from "@/components/vets/VetCard";
import { vetService } from "@/services/vetService";
import type { Vet } from "@/utils/types";
import { Loader } from "@/components/ui/Loader";

export default function VetsPage() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await vetService.list();
        setVets(data);
      } catch {
        setVets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-ink-900">Find a Vet</h1>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader label="Loading vets..." />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vets.map((vet) => (
            <VetCard key={vet.id} vet={vet} />
          ))}
          {vets.length === 0 ? <p className="text-sm text-ink-600">No vets found.</p> : null}
        </div>
      )}
    </div>
  );
}
