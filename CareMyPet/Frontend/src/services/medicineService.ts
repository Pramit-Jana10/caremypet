import { api, cachedGet } from "@/services/api";
import type { PrescriptionUploadResult, Product } from "@/utils/types";

export const medicineService = {
  async list(params?: { q?: string; petType?: string }) {
    const data = await cachedGet<{ success: boolean; data: Product[] }>("/medicines", params as Record<string, unknown>);
    return data.data;
  },
  async getById(id: string) {
    const { data } = await api.get<{ success: boolean; data: Product }>(`/medicines/${id}`);
    return data.data;
  },
  async uploadPrescription(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<{ success: boolean; data: PrescriptionUploadResult }>(
      "/uploads/prescription",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
    return data.data;
  }
};

