import type { JSX } from "react";
import {
  CheckCircle2,
  Clock,
  Images,
  LayoutGrid,
} from "lucide-react";
import { MetricCard } from "@/components/patterns/MetricCard";
import type { DashboardSummary } from "@/features/dashboard/useDashboardSummary";

function todayLabel(count: number | null): string | undefined {
  if (count == null) return undefined;
  return `+${count} hoje`;
}

export function DashboardSummaryCards(
  props: DashboardSummary,
): JSX.Element {
  if (props.isLoading && !props.isError) {
    return <p className="text-muted-foreground">Carregando resumo…</p>;
  }

  const metrics = [
    {
      href: "/posts",
      label: "Posts coletados",
      value: props.totalPosts,
      subtext: todayLabel(props.todayCollected),
      icon: <Images className="text-primary" />,
    },
    {
      href: "/moderation",
      label: "Pendentes",
      value: props.pendingPosts,
      subtext: todayLabel(props.todayPending),
      icon: <Clock className="text-status-warning" />,
    },
    {
      href: "/posts?status=approved",
      label: "Aprovados",
      value: props.approvedPosts,
      subtext: todayLabel(props.todayApproved),
      icon: <CheckCircle2 className="text-status-success" />,
    },
    {
      href: "/widgets",
      label: "Widgets ativos",
      value: props.widgets,
      subtext: "—",
      icon: <LayoutGrid className="text-accent-widgets" />,
    },
  ];

  return (
    <>
      {props.isError && (
        <div className="mb-4" role="alert">
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
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo do dashboard"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
    </>
  );
}
