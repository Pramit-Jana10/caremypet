import { api, cachedGet, invalidateCache } from "@/services/api";
import type { PetProfile, VaccineScheduleItem } from "@/utils/types";

export const vaccineService = {
  async listPets() {
    const data = await cachedGet<{ success: boolean; data: PetProfile[] }>("/pets");
    return data.data;
  },
  async createPet(payload: Omit<PetProfile, "id">) {
    const { data } = await api.post<{ success: boolean; data: PetProfile }>("/pets", payload);
    invalidateCache("/pets");
    return data.data;
  },
  async updatePet(petId: string, payload: Partial<Omit<PetProfile, "id">>) {
    const { data } = await api.put<{ success: boolean; data: PetProfile }>(`/pets/${petId}`, payload);
    invalidateCache("/pets");
    return data.data;
  },
  async deletePet(petId: string) {
    await api.delete(`/pets/${petId}`);
    invalidateCache("/pets");
  },
  async listSchedule(petId: string) {
    // Backend route: GET /api/vaccinations/pet/:petId
    const { data } = await api.get<{ success: boolean; data: VaccineScheduleItem[] }>(
      `/vaccinations/pet/${petId}`
    );
    return data.data;
  },
  async addScheduleItem(payload: Omit<VaccineScheduleItem, "id">) {
    // Backend route: POST /api/vaccinations
    const { data } = await api.post<{ success: boolean; data: VaccineScheduleItem }>(
      "/vaccinations",
      payload
    );
    invalidateCache(`/vaccinations/pet/${payload.petId}`);
    return data.data;
  },
  async markDone(id: string) {
    // Backend route: PUT /api/vaccinations/:id/complete
    const { data } = await api.put<{ success: boolean; data: VaccineScheduleItem }>(
      `/vaccinations/${id}/complete`
    );
    return data.data;
  },
  async updateScheduleItem(id: string, payload: Partial<Omit<VaccineScheduleItem, "id" | "petId">>) {
    const { data } = await api.put<{ success: boolean; data: VaccineScheduleItem }>(`/vaccinations/${id}`, payload);
    invalidateCache(`/vaccinations/pet/${data.data.petId}`);
    return data.data;
  },
  async deleteScheduleItem(id: string) {
    await api.delete(`/vaccinations/${id}`);
  },
};

