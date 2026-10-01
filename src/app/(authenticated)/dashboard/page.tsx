"use client";

import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/patterns/PageHeader";
import { DashboardActivityFeed } from "@/features/dashboard/DashboardActivityFeed";
import { DashboardChart } from "@/features/dashboard/DashboardChart";
import { DashboardFilterPanel } from "@/features/dashboard/DashboardFilterPanel";
import { DashboardPopularWidget } from "@/features/dashboard/DashboardPopularWidget";
import { DashboardSummaryCards } from "@/features/dashboard/DashboardSummaryCards";
import { useDashboardSummary } from "@/features/dashboard/useDashboardSummary";

export default function DashboardPage() {
  const { isLoading, user } = useAuth();
  const summary = useDashboardSummary();

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  if (!user) {
    return <p className="text-muted-foreground">Você não está autenticado.</p>;
  }

  return (
    <>
      <PageHeader
        description={`Plano ${user.plan}`}
        title={`Olá, ${user.name}`}
      />
      <DashboardSummaryCards {...summary} />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardChart />
          <DashboardActivityFeed />
        </div>
        <div className="space-y-6">
          <DashboardPopularWidget />
          <DashboardFilterPanel />
        </div>
      </div>
    </>
  );
}
