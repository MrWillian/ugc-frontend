import type { JSX } from "react";
import type { DashboardSummary } from "@/features/dashboard/useDashboardSummary";

export function DashboardSummaryCards(
  props: DashboardSummary,
): JSX.Element {
  if (props.isLoading && !props.isError) {
    return <p className="mt-6">Carregando resumo…</p>;
  }

  const metrics = [
    { label: "Campanhas ativas", value: props.activeCampaigns },
    { label: "Pendentes de moderação", value: props.pendingPosts },
    { label: "Widgets", value: props.widgets },
  ];

  return (
    <>
      {props.isError && (
        <div className="mt-6" role="alert">
          <p>{props.errorMessage ?? "Não foi possível carregar o resumo."}</p>
          <button
            className="mt-2 font-medium text-primary underline disabled:opacity-50"
            type="button"
            onClick={props.refetch}
            disabled={props.isFetching}
          >
            {props.isFetching ? "Tentando novamente…" : "Tentar novamente"}
          </button>
        </div>
      )}
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
    </>
  );
}
