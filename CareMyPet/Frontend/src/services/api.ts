import axios from "axios";
import { STORAGE_KEYS } from "@/utils/constants";

// ─── Simple in-memory TTL cache ──────────────────────────────────────────────
const _cache = new Map<string, { data: unknown; expiresAt: number }>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** GET with caching. TTL defaults to 5 min. */
export async function cachedGet<T>(
  url: string,
  params?: Record<string, unknown>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const key = url + JSON.stringify(params ?? {});
  const hit = _cache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.data as T;
  const res = await api.get<T>(url, { params });
  _cache.set(key, { data: res.data, expiresAt: Date.now() + ttlMs });
  return res.data;
}

/** Invalidate a single cache entry (pass the same url + params used in cachedGet). */
export function invalidateCache(url: string, params?: Record<string, unknown>) {
  _cache.delete(url + JSON.stringify(params ?? {}));
}

/** Wipe the entire cache (call on logout). */
export function clearApiCache() {
  _cache.clear();
}

export const api = axios.create({
  // Flask backend default; can be overridden via NEXT_PUBLIC_API_BASE_URL.
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem(STORAGE_KEYS.authToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.response?.status === 401;
    const isAuthRoute = (error.config?.url as string | undefined)?.includes("/auth/");
    if (is401 && !isAuthRoute && typeof window !== "undefined") {
      const hasToken = localStorage.getItem(STORAGE_KEYS.authToken);
      if (hasToken) {
        localStorage.removeItem(STORAGE_KEYS.authToken);
        localStorage.removeItem(STORAGE_KEYS.user);
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

