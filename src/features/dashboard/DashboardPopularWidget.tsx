"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchWidgets } from "@/features/dashboard/api";

async function countWidgetPosts(widgetId: string): Promise<number> {
  const response = await fetch(`/api/widget/${widgetId}/posts`, {
    credentials: "same-origin",
  });
  if (!response.ok) return 0;
  const body = (await response.json()) as { items?: unknown[] };
  return Array.isArray(body.items) ? body.items.length : 0;
}

export function DashboardPopularWidget() {
  const widgetsQuery = useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });

  const topWidgetsQuery = useQuery({
    queryKey: ["widgets", "popular-preview"],
    enabled: Boolean(widgetsQuery.data?.length),
    queryFn: async () => {
      const list = (widgetsQuery.data ?? []).slice(0, 5);
      const scored = await Promise.all(
        list.map(async (widget) => ({
          widget,
          count: await countWidgetPosts(widget.id),
        })),
      );
      scored.sort((a, b) => b.count - a.count || a.widget.id.localeCompare(b.widget.id));
      return scored[0]?.widget ?? list[0] ?? null;
    },
  });

  const winner = topWidgetsQuery.data;

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Seu widget mais popular</h2>
      {widgetsQuery.isLoading || topWidgetsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : null}
      {winner ? (
        <>
          <p className="text-sm font-medium">{winner.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">Layout {winner.layout}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="default">
              <Link href="/widgets">Ver widgets</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/widgets/${winner.id}`}>Gerar código</Link>
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Crie um widget para exibir posts no seu site.
        </p>
      )}
    </section>
  );
}
