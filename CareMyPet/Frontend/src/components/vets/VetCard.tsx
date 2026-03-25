// "use client";

// import Link from "next/link";
// import type { Vet } from "@/utils/types";
// import { Button } from "@/components/ui/Button";

// export function VetCard({ vet }: { vet: Vet }) {
//   return (
//     <div className="rounded-2xl bg-white p-5 shadow-soft">
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <Link href={`/vets/${vet.id}`} className="text-base font-semibold text-ink-900 hover:underline">
//             {vet.name}
//           </Link>
//           <p className="mt-1 text-sm text-ink-700">{vet.specialization}</p>
//           <p className="mt-1 text-sm text-ink-600">{vet.location}</p>
//         </div>
//         <div className="text-right">
//           <p className="text-sm font-semibold text-ink-900">★ {vet.rating.toFixed(1)}</p>
//           <p className="mt-1 text-xs text-ink-600">{vet.availability.length} slots</p>
//         </div>
//       </div>
//       <div className="mt-4 flex items-center justify-between gap-3">
//         <Button variant="secondary" asChild href={`/vets/${vet.id}`}>
//           View profile
//         </Button>
//         <Button asChild href={`/vets/${vet.id}/book`}>
//           Book
//         </Button>
//       </div>
//     </div>
//   );
// }













"use client";

import Link from "next/link";
import type { Vet } from "@/utils/types";
import { Button } from "@/components/ui/Button";

type VetCardProps = {
  vet: Vet;
};

export function VetCard({ vet }: VetCardProps) {
  // Defensive guards (prevents blank UI if data breaks)
  if (!vet) return null;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/vets/${vet.id}` as any}
            className="text-base font-semibold text-ink-900 hover:underline"
          >
            {vet.name}
          </Link>

          <p className="mt-1 text-sm text-ink-700">
            {vet.specialization}
          </p>

          <p className="mt-1 text-sm text-ink-600">
            {vet.location}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-ink-900">
            ★ {Number(vet.rating).toFixed(1)}
          </p>

          <p className="mt-1 text-xs text-ink-600">
            {vet.availability?.length ?? 0} slots
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="secondary" asChild>
          <Link href={`/vets/${vet.id}` as any}>View profile</Link>
        </Button>
      </div>
    </div>
  );
}


