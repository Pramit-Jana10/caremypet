"use client";

import Link from "next/link";
import { Product } from "@/utils/types";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-600">{product.category}</p>
          <Link href={`/shop/${product.id}`} className="mt-1 block text-base font-semibold text-ink-900 hover:underline">
            {product.name}
          </Link>
          <p className="mt-1 text-sm text-ink-700">{product.petType}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink-900">{formatCurrency(product.price)}</p>
          {product.rating ? <p className="mt-1 text-xs text-ink-600">★ {product.rating.toFixed(1)}</p> : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="secondary" asChild href={`/shop/${product.id}`}>
          Details
        </Button>
        <Button onClick={() => add(product, 1)}>Add to cart</Button>
      </div>
    </div>
  );
}

