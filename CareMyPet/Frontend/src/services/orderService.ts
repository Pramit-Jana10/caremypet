import { api } from "@/services/api";
import type { Order } from "@/utils/types";

export const orderService = {
  async listMyOrders() {
    // Backend route: GET /api/orders (scoped to current user via JWT)
    const { data } = await api.get<{ success: boolean; data: Order[] }>("/orders");
    return data.data;
  },
  async placeOrder(payload: {
    address: { fullName: string; line1: string; city: string; state: string; zip: string };
    paymentMethod: "COD";
  }) {
    // Backend route: POST /api/orders
    const { data } = await api.post<{ success: boolean; data: Order }>("/orders", payload);
    return data.data;
  }
};

