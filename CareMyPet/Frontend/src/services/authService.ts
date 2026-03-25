import { api } from "@/services/api";
import type { User } from "@/utils/types";

export type LoginPayload = { email: string; password: string; otpToken: string };
export type RegisterPayload = { name: string; email: string; password: string; otpToken: string };

export const authService = {
  async login(payload: LoginPayload): Promise<{ token: string; user: User }> {
    const { data } = await api.post<{ success: boolean; data: { token: string; user: User } }>(
      "/auth/login",
      payload
    );
    return data.data;
  },

  async adminLogin(payload: LoginPayload): Promise<{ token: string; user: User }> {
    const { data } = await api.post<{ success: boolean; data: { token: string; user: User } }>(
      "/auth/admin/login",
      payload
    );
    return data.data;
  },

  async sendOtp(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ success: boolean; data: { message: string } }>(
      "/auth/send-otp",
      { email }
    );
    return data.data;
  },

  async verifyOtp(email: string, otp: string): Promise<{ otpToken: string }> {
    const { data } = await api.post<{ success: boolean; data: { otpToken: string } }>(
      "/auth/verify-otp",
      { email, otp }
    );
    return data.data;
  },

  async sendLoginOtp(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ success: boolean; data: { message: string } }>(
      "/auth/send-login-otp",
      { email }
    );
    return data.data;
  },

  async verifyLoginOtp(email: string, otp: string): Promise<{ otpToken: string }> {
    const { data } = await api.post<{ success: boolean; data: { otpToken: string } }>(
      "/auth/verify-login-otp",
      { email, otp }
    );
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<{ token: string; user: User }> {
    const { data } = await api.post<{ success: boolean; data: { token: string; user: User } }>(
      "/auth/register",
      payload
    );
    return data.data;
  },

  async forgotPassword(email: string): Promise<{ message: string; debugResetLink?: string }> {
    const { data } = await api.post<{ success: boolean; data: { message: string; debugResetLink?: string } }>(
      "/auth/forgot-password",
      { email }
    );
    return data.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const { data } = await api.post<{ success: boolean; data: { message: string } }>(
      "/auth/reset-password",
      { token, password }
    );
    return data.data;
  },

  async me(): Promise<User> {
    // Matches Flask route: GET /api/auth/profile
    const { data } = await api.get<{ success: boolean; data: User }>("/auth/profile");
    return data.data;
  }
};

