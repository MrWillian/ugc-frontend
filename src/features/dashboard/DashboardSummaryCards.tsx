import type { JSX } from "react";
import type { DashboardSummary } from "@/features/dashboard/useDashboardSummary";

export function DashboardSummaryCards(
  props: DashboardSummary,
): JSX.Element {
  if (props.isLoading) {
    return <p className="mt-6">Carregando resumo…</p>;
  }

  if (props.isError) {
    return (
      <div className="mt-6" role="alert">
        <p>{props.errorMessage ?? "Não foi possível carregar o resumo."}</p>
        <button
          className="mt-2 font-medium text-primary underline"
          type="button"
          onClick={props.refetch}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const metrics = [
    { label: "Campanhas ativas", value: props.activeCampaigns },
    { label: "Pendentes de moderação", value: props.pendingPosts },
    { label: "Widgets", value: props.widgets },
  ];

  return (
    <section
      className="mt-6 grid gap-4 sm:grid-cols-3"
      aria-label="Resumo do dashboard"
    >
      {metrics.map((metric) => (
        <div className="rounded-lg border p-4" key={metric.label}>
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
        </div>
      ))}
    </section>
  );
}
