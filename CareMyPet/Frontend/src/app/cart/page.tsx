"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/format";
import { ROUTES } from "@/utils/constants";

export default function CartPage() {
  const { items, remove, setQty, total, clear } = useCart();
  const hasItems = items.length > 0;

  const summary = useMemo(() => {
    const subtotal = total;
    const shipping = hasItems ? 4.99 : 0;
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + shipping + tax;
    return { subtotal, shipping, tax, grandTotal };
  }, [hasItems, total]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Cart</h1>
          <p className="mt-1 text-sm text-ink-700">Review your items and proceed to checkout.</p>
        </div>
        {hasItems ? (
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {!hasItems ? (
            <div className="rounded-2xl bg-white p-8 shadow-soft">
              <p className="text-sm text-ink-700">Your cart is empty.</p>
              <div className="mt-4">
                <Button asChild href={ROUTES.shop}>
                  Continue shopping
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((i) => (
                <div key={i.product.id} className="rounded-2xl bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{i.product.name}</p>
                      <p className="mt-1 text-xs text-ink-600">{i.product.category}</p>
                      <p className="mt-2 text-sm text-ink-700">{formatCurrency(i.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="h-10 w-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50"
                          onClick={() => setQty(i.product.id, i.qty - 1)}
                        >
                          −
                        </button>
                        <input
                          className="h-10 w-16 rounded-xl border border-ink-200 bg-white text-center text-sm"
                          value={i.qty}
                          onChange={(e) => setQty(i.product.id, Number(e.target.value) || 1)}
                        />
                        <button
                          className="h-10 w-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50"
                          onClick={() => setQty(i.product.id, i.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <Button variant="ghost" onClick={() => remove(i.product.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink-900">Summary</h2>
          <div className="mt-4 space-y-2 text-sm text-ink-700">
            <Row label="Subtotal" value={formatCurrency(summary.subtotal)} />
            <Row label="Shipping" value={formatCurrency(summary.shipping)} />
            <Row label="Tax" value={formatCurrency(summary.tax)} />
            <div className="my-3 border-t border-ink-100" />
            <Row label={<span className="font-semibold text-ink-900">Total</span>} value={formatCurrency(summary.grandTotal)} />
          </div>
          <div className="mt-6 space-y-3">
            <Button asChild className="w-full" disabled={!hasItems} href={ROUTES.checkout}>
              Checkout
            </Button>
            <Link href={ROUTES.shop} className="block text-center text-sm text-ink-700 hover:underline">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}

