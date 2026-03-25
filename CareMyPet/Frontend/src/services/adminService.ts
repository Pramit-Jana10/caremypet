import { api } from "@/services/api";
import type { User } from "@/utils/types";

export type UpdatePremiumPayload = {
  enabled: boolean;
  plan: string;
  features: string[];
  expiresOn?: string;
};

export const adminService = {
  async listUsers(): Promise<User[]> {
    const { data } = await api.get<{ success: boolean; data: User[] }>("/admin/users");
    return data.data;
  },

  async updateUserPremium(userId: string, payload: UpdatePremiumPayload): Promise<User> {
    const { data } = await api.put<{ success: boolean; data: User }>(`/admin/users/${userId}/premium`, payload);
    return data.data;
  }
};
