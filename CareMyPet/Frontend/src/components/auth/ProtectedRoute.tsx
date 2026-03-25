"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import { Loader } from "@/components/ui/Loader";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !token) {
      const next = encodeURIComponent(pathname || ROUTES.dashboard);
      router.replace(`${ROUTES.login}?next=${next}`);
    }
  }, [isLoading, pathname, router, token]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader label="Checking session..." />
        </div>
      </div>
    );
  }

  if (!token) return null;

  return <>{children}</>;
}

