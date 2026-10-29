"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { InstagramConnectionCard } from "@/features/instagram/InstagramConnectionCard";

export function DashboardInstagramCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Captured once: the flag must outlive the URL cleanup below.
  const [justConnected] = useState(
    () => searchParams.get("instagram") === "connected",
  );

  useEffect(() => {
    if (justConnected) {
      router.replace("/dashboard", { scroll: false });
    }
  }, [justConnected, router]);

  return (
    <section
      aria-labelledby="dashboard-instagram-heading"
      className="rounded-xl border bg-card p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold" id="dashboard-instagram-heading">
        Instagram
      </h2>
      <InstagramConnectionCard justConnected={justConnected} />
    </section>
  );
}

export function DashboardInstagramCardSkeleton() {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Instagram</h2>
      <p className="text-sm text-muted-foreground">
        Carregando conexão do Instagram...
      </p>
    </section>
  );
}
