"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { fetchPostSample } from "@/features/dashboard/post-sample";
import type { CollectedPost } from "@/types";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function authorHandle(post: CollectedPost): string {
  const username = post.authorData?.username;
  if (typeof username === "string" && username.length > 0) {
    return `@${username}`;
  }
  return "Autor desconhecido";
}

export function DashboardActivityFeed() {
  const query = useQuery({
    queryKey: ["posts", { scope: "dashboard-feed" }],
    queryFn: () => fetchPostSample(500),
  });

  const recent = [...(query.data ?? [])]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Atividades recentes</h2>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : null}
      {query.isError ? (
        <p className="text-sm text-destructive" role="alert">
          Não foi possível carregar atividades.
        </p>
      ) : null}
      <ul className="divide-y">
        {recent.map((post) => (
          <li key={post.id}>
            <Link
              className="flex gap-3 py-3 transition-colors hover:bg-muted/30"
              href={`/posts/${post.id}`}
            >
              {post.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="size-12 shrink-0 rounded-lg object-cover"
                  src={post.thumbnailUrl}
                />
              ) : (
                <span className="size-12 shrink-0 rounded-lg bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{authorHandle(post)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(post.createdAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {post.caption ?? "Sem legenda"}
                </p>
              </div>
              <StatusBadge status={post.status} />
            </Link>
          </li>
        ))}
      </ul>
      {!query.isLoading && recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum post ainda.</p>
      ) : null}
    </section>
  );
}
