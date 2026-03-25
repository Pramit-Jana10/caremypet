"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { STORAGE_KEYS, ROUTES } from "@/utils/constants";
import type { User } from "@/utils/types";
import { authService } from "@/services/authService";
import { clearApiCache } from "@/services/api";

type AuthState = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (payload: { email: string; password: string; otpToken: string }) => Promise<void>;
  adminLogin: (payload: { email: string; password: string; otpToken: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; otpToken: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage (client-only).
    try {
      const t = localStorage.getItem(STORAGE_KEYS.authToken);
      const u = localStorage.getItem(STORAGE_KEYS.user);
      setToken(t);
      setUser(u ? (JSON.parse(u) as User) : null);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = useCallback((t: string | null, u: User | null) => {
    if (t) localStorage.setItem(STORAGE_KEYS.authToken, t);
    else localStorage.removeItem(STORAGE_KEYS.authToken);
    if (u) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
      persist(token, me);
    } catch {
      // If token is invalid, log out.
      if (token) {
        setToken(null);
        setUser(null);
        persist(null, null);
      }
    }
  }, [persist, token]);

  const login = useCallback(
    async (payload: { email: string; password: string; otpToken: string }) => {
      try {
        const res = await authService.login(payload);
        setToken(res.token);
        setUser(res.user);
        persist(res.token, res.user);
        toast.success("Welcome back!");
        const targetRoute = res.user?.role === "admin" ? ROUTES.admin : (next || ROUTES.dashboard);
        router.push(targetRoute as any);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Login failed");
        throw e;
      }
    },
    [next, persist, router]
  );

  const adminLogin = useCallback(
    async (payload: { email: string; password: string; otpToken: string }) => {
      try {
        const res = await authService.adminLogin(payload);
        setToken(res.token);
        setUser(res.user);
        persist(res.token, res.user);
        toast.success("Admin session started");
        router.push(ROUTES.admin as any);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Admin login failed");
        throw e;
      }
    },
    [persist, router]
  );

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; otpToken: string }) => {
      try {
        const res = await authService.register(payload);
        setToken(res.token);
        setUser(res.user);
        persist(res.token, res.user);
        toast.success("Account created!");
        router.push((next || ROUTES.dashboard) as any);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Registration failed");
        throw e;
      }
    },
    [next, persist, router]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persist(null, null);
    clearApiCache();
    toast.success("Logged out");
    router.push(ROUTES.home as any);
  }, [persist, router]);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isLoading, login, adminLogin, register, logout, refreshMe }),
    [token, user, isLoading, login, adminLogin, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

