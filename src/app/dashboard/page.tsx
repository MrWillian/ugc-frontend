"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { DashboardSummaryCards } from "@/features/dashboard/DashboardSummaryCards";
import { useDashboardSummary } from "@/features/dashboard/useDashboardSummary";
import { InstagramConnectionCard } from "@/features/instagram/InstagramConnectionCard";

export default function DashboardPage() {
  const { isLoading, user } = useAuth();
  const summary = useDashboardSummary();

  if (isLoading) {
    return <main className="p-6">Carregando...</main>;
  }

  return (
    <main className="p-6">
      {user ? (
        <>
          <DashboardHeader name={user.name} plan={user.plan} />
          <DashboardSummaryCards {...summary} />
          <InstagramConnectionCard />
          <Link className="mt-4 inline-block text-primary underline" href="/logout">
            Sair
          </Link>
        </>
      ) : (
        <p className="mt-4">Você não está autenticado.</p>
      )}
    </main>
  );
}
