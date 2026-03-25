"use client";

import { createContext, useMemo, useState } from "react";
import type { Order, PetProfile, VaccineScheduleItem } from "@/utils/types";
import { mockOrders, mockPets, mockVaccineSchedule } from "@/utils/mockData";

type UserDataContextValue = {
  pets: PetProfile[];
  setPets: React.Dispatch<React.SetStateAction<PetProfile[]>>;
  vaccineSchedule: VaccineScheduleItem[];
  setVaccineSchedule: React.Dispatch<React.SetStateAction<VaccineScheduleItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
};

export const UserDataContext = createContext<UserDataContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Frontend-first: use mock data; can be replaced with API calls later.
  const [pets, setPets] = useState<PetProfile[]>(mockPets);
  const [vaccineSchedule, setVaccineSchedule] = useState<VaccineScheduleItem[]>(mockVaccineSchedule);
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const value = useMemo<UserDataContextValue>(
    () => ({
      pets,
      setPets,
      vaccineSchedule,
      setVaccineSchedule,
      orders,
      setOrders
    }),
    [orders, pets, vaccineSchedule]
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

