import { Suspense } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import {
  DashboardActivityFeed,
} from "@/features/dashboard/DashboardActivityFeed";
import { DashboardChart } from "@/features/dashboard/DashboardChart";
import { DashboardFilterPanel } from "@/features/dashboard/DashboardFilterPanel";
import {
  DashboardGreeting,
  DashboardGreetingSkeleton,
  DashboardPlan,
  DashboardPlanSkeleton,
} from "@/features/dashboard/DashboardGreeting";
import {
  DashboardInstagramCard,
  DashboardInstagramCardSkeleton,
} from "@/features/dashboard/DashboardInstagramCard";
import { DashboardPopularWidget } from "@/features/dashboard/DashboardPopularWidget";
import {
  DashboardSummaryCards,
  DashboardSummaryCardsSkeleton,
} from "@/features/dashboard/DashboardSummaryCards";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        description={
          <Suspense fallback={<DashboardPlanSkeleton />}>
            <DashboardPlan />
          </Suspense>
        }
        testId="dashboard-shell-marker"
        title={
          <Suspense fallback={<DashboardGreetingSkeleton />}>
            <DashboardGreeting />
          </Suspense>
        }
      />
      <Suspense fallback={<DashboardSummaryCardsSkeleton />}>
        <DashboardSummaryCards />
      </Suspense>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardChart />
          <DashboardActivityFeed />
        </div>
        <div className="space-y-6">
          <Suspense fallback={<DashboardInstagramCardSkeleton />}>
            <DashboardInstagramCard />
          </Suspense>
          <DashboardPopularWidget />
          <DashboardFilterPanel />
        </div>
      </div>
    </>
  );
}
