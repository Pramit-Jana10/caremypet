"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { vaccineService } from "@/services/vaccineService";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getDaysRemaining(dueDateIso: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDateIso));
  return Math.round((due.getTime() - today.getTime()) / DAY_MS);
}

type VaccinationAlertSummary = {
  dueTodayOrOverdueCount: number;
  hasOverdue: boolean;
  priorityAlert: {
    petId: string;
    vaccineId: string;
    vaccineName: string;
    daysRemaining: number;
  } | null;
};

const EMPTY_SUMMARY: VaccinationAlertSummary = {
  dueTodayOrOverdueCount: 0,
  hasOverdue: false,
  priorityAlert: null,
};

export function useVaccinationAlerts(enabled: boolean) {
  const [summary, setSummary] = useState<VaccinationAlertSummary>(EMPTY_SUMMARY);
  const [shouldPulse, setShouldPulse] = useState(false);
  const initializedRef = useRef(false);
  const previousCountRef = useRef(0);
  const pulseTimeoutRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    try {
      const pets = await vaccineService.listPets();
      if (!pets.length) {
        setSummary(EMPTY_SUMMARY);
        return;
      }

      const scheduleLists = await Promise.all(
        pets.map((pet) => vaccineService.listSchedule(pet.id).catch(() => []))
      );

      const pendingItems = scheduleLists.flatMap((items, index) =>
        items
          .filter((item) => item.status === "Pending")
          .map((item) => ({
            ...item,
            petId: pets[index].id,
            daysRemaining: getDaysRemaining(item.dueDateIso),
          }))
      );
      const dueTodayOrOverdue = pendingItems.filter((item) => item.daysRemaining <= 0);
      const hasOverdue = pendingItems.some((item) => item.daysRemaining < 0);
      const priorityAlert = [...dueTodayOrOverdue].sort((a, b) => {
        if (a.daysRemaining === 0 && b.daysRemaining !== 0) return -1;
        if (b.daysRemaining === 0 && a.daysRemaining !== 0) return 1;
        return b.daysRemaining - a.daysRemaining;
      })[0] ?? null;
      const nextCount = dueTodayOrOverdue.length;

      if (initializedRef.current && nextCount > previousCountRef.current) {
        setShouldPulse(true);
        if (pulseTimeoutRef.current !== null) {
          window.clearTimeout(pulseTimeoutRef.current);
        }
        pulseTimeoutRef.current = window.setTimeout(() => {
          setShouldPulse(false);
          pulseTimeoutRef.current = null;
        }, 9000);
      }

      previousCountRef.current = nextCount;
      initializedRef.current = true;

      setSummary({
        dueTodayOrOverdueCount: nextCount,
        hasOverdue,
        priorityAlert: priorityAlert
          ? {
              petId: priorityAlert.petId,
              vaccineId: priorityAlert.id,
              vaccineName: priorityAlert.vaccineName,
              daysRemaining: priorityAlert.daysRemaining,
            }
          : null,
      });
    } catch {
      setSummary(EMPTY_SUMMARY);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();

    if (!enabled) return;

    const interval = window.setInterval(() => {
      void refresh();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, [enabled, refresh]);

  return useMemo(
    () => ({
      ...summary,
      shouldPulse,
      hasAlerts: summary.dueTodayOrOverdueCount > 0,
      refresh,
    }),
    [summary, shouldPulse, refresh]
  );
}
