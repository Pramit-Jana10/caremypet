import { api, cachedGet } from "@/services/api";
import type { Product, Review } from "@/utils/types";

export const productService = {
  async list(params?: { q?: string; category?: string; petType?: string; minPrice?: number; maxPrice?: number }) {
    const data = await cachedGet<{ success: boolean; data: Product[] }>("/products", params as Record<string, unknown>);
    return data.data;
  },
  async getById(id: string) {
    const { data } = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return data.data;
  },
  async listReviews(productId: string) {
    const { data } = await api.get<{ success: boolean; data: Review[] }>(
      `/products/${productId}/reviews`
    );
    return data.data;
  }
};

