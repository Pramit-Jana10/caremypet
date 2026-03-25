"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { vetService } from "@/services/vetService";
import type { Vet } from "@/utils/types";
import { Loader } from "@/components/ui/Loader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export function VetDetailPageClient() {
  const params = useParams<{ id: string }>();
  const vetId = params.id;

  return (
    <ProtectedRoute>
      <VetDetailInner vetId={vetId} />
    </ProtectedRoute>
  );
}

function VetDetailInner({ vetId }: { vetId: string }) {
  const [vet, setVet] = useState<Vet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const vetRes = await vetService.getById(vetId);
        setVet(vetRes);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load vet details");
      } finally {
        setLoading(false);
      }
    })();
  }, [vetId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center">
          <Loader label="Loading vet..." />
        </div>
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-ink-700">Vet not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold text-ink-600">{vet.specialization}</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900">{vet.name}</h1>
        <p className="mt-1 text-sm text-ink-700">{vet.location}</p>
        <p className="mt-2 text-sm text-ink-700">{vet.bio}</p>
        <p className="mt-3 text-sm text-ink-700">Rating: ★ {vet.rating?.toFixed(1) ?? "N/A"}</p>
      </div>
    </div>
  );
}
