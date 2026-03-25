"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/format";
import { orderService } from "@/services/orderService";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("User's Name");
  const [line1, setLine1] = useState("123 Market Street");
  const [city, setCity] = useState("Kolkata");
  const [state, setState] = useState("West Bengal");
  const [zip, setZip] = useState("700091");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const summary = useMemo(() => {
    const subtotal = total;
    const shipping = items.length ? 4.99 : 0;
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + shipping + tax;
    return { subtotal, shipping, tax, grandTotal };
  }, [items.length, total]);

  function validate() {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = "Enter full name";
    if (line1.trim().length < 3) e.line1 = "Enter address";
    if (city.trim().length < 2) e.city = "Enter city";
    if (state.trim().length < 2) e.state = "Enter state";
    if (zip.trim().length < 4) e.zip = "Enter ZIP";
    if (items.length === 0) e.cart = "Your cart is empty";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    if (!validate()) return;
    setLoading(true);
    try {
      await orderService.placeOrder({
        address: { fullName, line1, city, state, zip },
        paymentMethod: "COD",
      });
      clear();
      toast.success("Order placed!");
      router.push("/checkout/success");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Checkout</h1>
        <p className="mt-1 text-sm text-ink-700">Enter shipping details. Payment: Cash on Delivery.</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink-900">Shipping address</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
              <Input label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} error={errors.zip} />
              <div className="md:col-span-2">
                <Input label="Address line" value={line1} onChange={(e) => setLine1(e.target.value)} error={errors.line1} />
              </div>
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} error={errors.city} />
              <Input label="State" value={state} onChange={(e) => setState(e.target.value)} error={errors.state} />
            </div>
            {errors.cart ? <p className="mt-4 text-sm text-red-600">{errors.cart}</p> : null}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink-900">Payment</h2>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-4">
              <p className="text-sm font-semibold text-ink-900">Cash on Delivery</p>
              <p className="text-xs text-ink-600">Pay when received</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ink-900">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.product.id} className="flex items-center justify-between gap-3">
                  <span className="text-ink-700">
                    {i.product.name} * {i.qty}
                  </span>
                  <span className="text-ink-900">{formatCurrency(i.product.price * i.qty)}</span>
                </div>
              ))}
              {items.length === 0 ? <p className="text-ink-600">No items.</p> : null}
            </div>
            <div className="border-t border-ink-100 pt-3 space-y-2">
              <Row label="Subtotal" value={formatCurrency(summary.subtotal)} />
              <Row label="Shipping" value={formatCurrency(summary.shipping)} />
              <Row label="Tax" value={formatCurrency(summary.tax)} />
              <Row label={<span className="font-semibold text-ink-900">Total</span>} value={formatCurrency(summary.grandTotal)} />
            </div>
          </div>

          <Button className="mt-6 w-full" disabled={loading || items.length === 0} onClick={() => void placeOrder()}>
            {loading ? "Placing..." : "Place order"}
          </Button>
          <p className="mt-3 text-xs text-ink-500">
            {/* This UI is production-ready; connect your backend to fully enable payments and order creation. */}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-700">{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}

