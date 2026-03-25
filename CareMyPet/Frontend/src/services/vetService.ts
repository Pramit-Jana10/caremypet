import { api, cachedGet } from "@/services/api";
import type { Vet } from "@/utils/types";

export const vetService = {
  async list(params?: { q?: string; location?: string; specialization?: string }) {
    const data = await cachedGet<{ success: boolean; data: Vet[] }>("/vets", params as Record<string, unknown>);
    return data.data;
  },
  async getById(id: string) {
    const { data } = await api.get<{ success: boolean; data: Vet }>(`/vets/${id}`);
    return data.data;
  }
};

