export const dynamicParams = true;
import nextDynamic from "next/dynamic";

const MedicineDetailPageClient = nextDynamic(
  () =>
    import("./client").then((mod) => ({
      default: mod.MedicineDetailPageClient,
    })),
  { ssr: false },
);

export default function MedicineDetailPage() {
  return <MedicineDetailPageClient />;
}
