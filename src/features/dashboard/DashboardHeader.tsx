import type { JSX } from "react";
import type { Plan } from "@/types";

export function DashboardHeader({
  name,
  plan,
}: {
  name: string;
  plan: Plan;
}): JSX.Element {
  return (
    <header>
      <h1 className="text-2xl font-semibold">{name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Plano {plan}</p>
    </header>
  );
}
