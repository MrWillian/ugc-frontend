"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { bucketPostsByDay } from "@/features/dashboard/bucket-posts-by-day";
import { fetchPostSample } from "@/features/dashboard/post-sample";

export function DashboardChart() {
  const query = useQuery({
    queryKey: ["posts", { scope: "dashboard-chart" }],
    queryFn: () => fetchPostSample(500),
  });

  if (query.isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Carregando gráfico…</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm" role="alert">
        <p className="text-sm">Não foi possível carregar o gráfico.</p>
      </div>
    );
  }

  const data = bucketPostsByDay(query.data ?? [], 7);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Evolução da coleta</h2>
        <span className="rounded-lg border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          Últimos 7 dias
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              dataKey="count"
              dot={{ r: 4 }}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
