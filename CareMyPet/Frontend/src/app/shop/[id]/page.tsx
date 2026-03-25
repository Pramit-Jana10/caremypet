export const dynamicParams = true;
import nextDynamic from "next/dynamic";

const ProductDetailPageClient = nextDynamic(
  () =>
    import("./client").then((mod) => ({
      default: mod.ProductDetailPageClient,
    })),
  { ssr: false },
);

export default function ProductDetailPage() {
  return <ProductDetailPageClient />;
}