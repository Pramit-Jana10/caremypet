"use client";

import { useContext } from "react";
import { UserDataContext } from "@/context/UserContext";

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData must be used within UserProvider");
  return ctx;
}

