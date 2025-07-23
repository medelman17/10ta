"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function EnsureUserSync({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function syncUser() {
      if (isLoaded && isSignedIn) {
        try {
          const response = await fetch("/api/auth/sync");
          const data = await response.json();
          
          if (data.isNew) {
            // New user was created, redirect to onboarding
            router.push("/onboarding");
          }
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, router]);

  return <>{children}</>;
}