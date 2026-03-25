"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/utils/types";
import { productService } from "@/services/productService";
import { Loader } from "@/components/ui/Loader";

export function ProductDetailPageClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await productService.getById(id);
        setProduct(data);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center">
          <Loader label="Loading product..." />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-ink-700">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="rounded-2xl bg-gradient-to-br from-brand-100 via-white to-sky-100 p-6">
            <p className="text-xs font-semibold text-ink-600">{product.category}</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink-900">{product.name}</h1>
            <p className="mt-2 text-sm text-ink-700">{product.description}</p>
            <p className="mt-4 text-lg font-semibold text-ink-900">{formatCurrency(product.price)}</p>
            <p className="mt-1 text-sm text-ink-600">Pet type: {product.petType}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink-900">Purchase</h2>
          <div className="mt-4 flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-ink-800">Quantity</label>
            <div className="flex items-center gap-2">
              <button
                className="h-10 w-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <input
                className="h-10 w-16 rounded-xl border border-ink-200 bg-white text-center text-sm"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
              />
              <button
                className="h-10 w-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
              >
                +
              </button>
            </div>
          </div>
          <Button className="mt-5 w-full" onClick={() => add(product, qty)}>
            Add to cart
          </Button>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-ink-900">Reviews</h3>
            <p className="mt-3 text-sm text-ink-600">
              Product reviews will appear here once connected to the backend reviews API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
