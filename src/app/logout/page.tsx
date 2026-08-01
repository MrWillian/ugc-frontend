"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) {
      return;
    }

    hasLoggedOut.current = true;
    void (async () => {
      try {
        await logout();
      } finally {
        router.replace("/login");
      }
    })();
  }, [logout, router]);

  return <main className="flex flex-1 items-center justify-center">Saindo...</main>;
}
