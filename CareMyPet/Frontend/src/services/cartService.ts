import { api } from "@/services/api";
import type { CartItem } from "@/utils/types";

export const cartService = {
  async getCart() {
    const { data } = await api.get<{ success: boolean; data: CartItem[] }>("/cart");
    return data.data;
  },
  async addItem(productId: string, quantity: number) {
    // Backend: POST /api/cart/add
    const { data } = await api.post<{ success: boolean; data: CartItem[] }>("/cart/add", {
      productId,
      quantity
    });
    return data.data;
  },
  async updateItem(productId: string, quantity: number) {
    // Backend: PUT /api/cart/update
    const { data } = await api.put<{ success: boolean; data: CartItem[] }>("/cart/update", {
      productId,
      quantity
    });
    return data.data;
  },
  async removeItem(productId: string) {
    // Backend: DELETE /api/cart/remove/:productId
    const { data } = await api.delete<{ success: boolean; data: CartItem[] }>(
      `/cart/remove/${productId}`
    );
    return data.data;
  }
};

