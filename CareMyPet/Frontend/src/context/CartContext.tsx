"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ROUTES, STORAGE_KEYS } from "@/utils/constants";
import type { CartItem, Product } from "@/utils/types";
import { cartService } from "@/services/cartService";

type CartContextValue = {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

export const CartContext = createContext<CartContextValue | null>(null);

function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message || fallback;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.cart);
      setItems(raw ? (JSON.parse(raw) as CartItem[]) : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    function add(product: Product, qty = 1) {
      const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.authToken) : null;
      if (!token && typeof window !== "undefined") {
        const nextPath = `${window.location.pathname}${window.location.search || ""}`;
        const next = encodeURIComponent(nextPath || "/");
        window.location.href = `${ROUTES.login}?next=${next}`;
        return;
      }

      const prevItems = items;
      setItems((prev) => {
        const found = prev.find((i) => i.product.id === product.id);
        if (found) {
          return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + qty } : i));
        }
        return [...prev, { product, qty }];
      });
      cartService
        .addItem(product.id, qty)
        .then(() => {
          toast.success("Added to cart");
        })
        .catch((error) => {
          setItems(prevItems);
          toast.error(getErrorMessage(error, "Could not add item to cart"));
        });
    }

    function remove(productId: string) {
      const prevItems = items;
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      cartService
        .removeItem(productId)
        .then(() => {
          toast.success("Removed from cart");
        })
        .catch((error) => {
          setItems(prevItems);
          toast.error(getErrorMessage(error, "Could not remove item"));
        });
    }

    function setQty(productId: string, qty: number) {
      const safeQty = Math.max(1, Math.min(99, qty));
      const prevItems = items;
      setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, qty: safeQty } : i)));
      cartService.updateItem(productId, safeQty).catch((error) => {
        setItems(prevItems);
        toast.error(getErrorMessage(error, "Could not update quantity"));
      });
    }

    function clear() {
      const prevItems = items;
      setItems([]);
      Promise.all(items.map((item) => cartService.removeItem(item.product.id))).catch(() => {
        setItems(prevItems);
      });
    }

    const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    const count = items.reduce((sum, i) => sum + i.qty, 0);

    return { items, add, remove, setQty, clear, total, count };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

