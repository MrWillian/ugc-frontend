import { getSessionUser } from "@/lib/session";

export function DashboardGreetingSkeleton() {
  return (
    <span
      aria-hidden
      className="inline-block h-7 w-56 animate-pulse rounded bg-muted align-middle"
    />
  );
}

export function DashboardPlanSkeleton() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-20 animate-pulse rounded bg-muted align-middle"
    />
  );
}

export async function DashboardGreeting() {
  const user = await getSessionUser();
  if (!user) return "Olá";

  return <span data-testid="dashboard-greeting">Olá, {user.name}</span>;
}

export async function DashboardPlan() {
  const user = await getSessionUser();
  if (!user) return null;

  return <>Plano {user.plan}</>;
}
