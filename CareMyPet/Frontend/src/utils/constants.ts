import type { Route } from "next";

export const APP_NAME = "CareMyPet";

export const STORAGE_KEYS = {
  authToken: "spc_auth_token",
  user: "spc_user",
  cart: "spc_cart"
} as const;

export const ROUTES = {
  home: "/" as Route,
  login: "/auth/login" as Route,
  adminLogin: "/auth/admin-login" as Route,
  register: "/auth/register" as Route,
  forgotPassword: "/auth/forgot-password" as Route,
  resetPassword: "/auth/reset-password" as Route,
  library: "/library" as Route,
  assistant: "/assistant" as Route,
  diary: "/diary" as Route,
  symptomChecker: "/symptoms" as Route,
  community: "/community" as Route,
  shop: "/shop" as Route,
  vets: "/vets" as Route,
  vaccinations: "/vaccinations" as Route,
  medicines: "/medicines" as Route,
  contact: "/contact" as Route,
  dashboard: "/dashboard" as Route,
  cart: "/cart" as Route,
  checkout: "/checkout" as Route,
  profile: "/profile" as Route,
  admin: "/admin" as Route
} as const;

