"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModerationQueue } from "@/features/posts/useModerationQueue";
import type { CollectedPost, ModerationQuery } from "@/types";

function formatPostedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

function thumbnailSrc(post: CollectedPost): string | null {
  if (post.thumbnailUrl) return post.thumbnailUrl;
  if (post.contentType === "IMAGE") return post.contentUrl;
  return null;
}

function shortCaption(caption: string | null): string {
  const text = caption?.trim() || "—";
  if (text.length <= 80) return text;
  return `${text.slice(0, 77).trimEnd()}...`;
}

function postedAtInRange(postedAt: string, from?: string, to?: string): boolean {
  const day = postedAt.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

function moderationHref(
  current: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/moderation?${qs}` : "/moderation";
}

function filtersFromSearchParams(searchParams: URLSearchParams): ModerationQuery & {
  from?: string;
  to?: string;
} {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const campaignId = searchParams.get("campaignId")?.trim() || undefined;
  const from = searchParams.get("from")?.trim() || undefined;
  const to = searchParams.get("to")?.trim() || undefined;

  return {
    page,
    limit: 20,
    status: "pending",
    campaignId,
    from,
    to,
  };
}

export function ModerationQueue(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);
  const {
    postsQuery,
    campaignsQuery,
    approveMutation,
    rejectMutation,
    batchApproveMutation,
    batchRejectMutation,
  } = useModerationQueue(filters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const campaigns = Array.isArray(campaignsQuery.data) ? campaignsQuery.data : [];
  const posts = useMemo(() => {
    return (postsQuery.data?.data ?? []).filter((post) =>
      postedAtInRange(post.postedAt, filters.from, filters.to),
    );
  }, [filters.from, filters.to, postsQuery.data?.data]);
  const meta = postsQuery.data?.meta;
  const visibleIds = posts.map((post) => post.id);
  const selectedVisible = selectedIds.filter((id) => visibleIds.includes(id));
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedVisible.includes(id));
  const error =
    postsQuery.error ??
    approveMutation.error ??
    rejectMutation.error ??
    batchApproveMutation.error ??
    batchRejectMutation.error;
  const batchBusy =
    batchApproveMutation.isPending || batchRejectMutation.isPending;
  const actingId = approveMutation.isPending
    ? approveMutation.variables
    : rejectMutation.isPending
      ? rejectMutation.variables?.id
      : null;

  function updateUrl(updates: Record<string, string | null>) {
    router.replace(moderationHref(searchParams, updates));
  }

  function toggleSelected(postId: string) {
    setSelectedIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    );
  }

  function toggleSelectAll() {
    setSelectedIds(allVisibleSelected ? [] : visibleIds);
  }

  async function handleApprove(postId: string) {
    await approveMutation.mutateAsync(postId);
    setSelectedIds((current) => current.filter((id) => id !== postId));
  }

  async function handleReject(postId: string) {
    const reason = window.prompt("Motivo da rejeição");
    if (reason === null || !reason.trim()) return;
    await rejectMutation.mutateAsync({
      id: postId,
      rejection_reasons: reason.trim(),
    });
    setSelectedIds((current) => current.filter((id) => id !== postId));
  }

  async function handleBatchApprove() {
    if (selectedVisible.length === 0) return;
    await batchApproveMutation.mutateAsync(selectedVisible);
    setSelectedIds([]);
  }

  async function handleBatchReject() {
    if (selectedVisible.length === 0) return;
    const reason = window.prompt("Motivo da rejeição");
    if (reason === null || !reason.trim()) return;
    await batchRejectMutation.mutateAsync({
      ids: selectedVisible,
      rejection_reasons: reason.trim(),
    });
    setSelectedIds([]);
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Moderação</h1>
        <Link className="text-primary underline" href="/posts">
          Ver todos os posts
        </Link>
      </div>
      <form
        className="mb-6 grid gap-4 sm:grid-cols-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid gap-2">
          <Label htmlFor="campaignId">Campanha</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            id="campaignId"
            value={filters.campaignId ?? ""}
            onChange={(event) =>
              updateUrl({ campaignId: event.target.value, page: "1" })
            }
          >
            <option value="">Todas</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="from">De</Label>
          <Input
            id="from"
            type="date"
            value={filters.from ?? ""}
            onChange={(event) =>
              updateUrl({ from: event.target.value, page: "1" })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="to">Até</Label>
          <Input
            id="to"
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => updateUrl({ to: event.target.value, page: "1" })}
          />
        </div>
      </form>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            aria-label="Selecionar todos"
            checked={allVisibleSelected}
            disabled={posts.length === 0 || batchBusy}
            onChange={toggleSelectAll}
            type="checkbox"
          />
          Selecionar todos
        </label>
        <p className="text-sm text-muted-foreground">
          {selectedVisible.length} selecionados
        </p>
        <Button
          disabled={selectedVisible.length === 0 || batchBusy}
          onClick={() => void handleBatchApprove()}
          size="sm"
        >
          Aprovar selecionados
        </Button>
        <Button
          disabled={selectedVisible.length === 0 || batchBusy}
          onClick={() => void handleBatchReject()}
          size="sm"
          variant="destructive"
        >
          Rejeitar selecionados
        </Button>
      </div>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {requestError(error)}
        </p>
      ) : null}
      {postsQuery.isLoading ? (
        <p>Carregando posts pendentes...</p>
      ) : posts.length === 0 ? (
        <p>Nenhum post pendente.</p>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const imageSrc = thumbnailSrc(post);
              const caption = shortCaption(post.caption);
              const selectLabel = `Selecionar ${post.caption?.trim() || post.id}`;
              const username = post.authorData?.username?.trim() || "—";
              const busy = actingId === post.id || batchBusy;
              return (
                <li key={post.id}>
                  <article
                    aria-label={`${username}: ${caption}`}
                    className="flex h-full flex-col overflow-hidden rounded-lg border"
                  >
                    <div className="relative bg-muted">
                      <label className="absolute left-2 top-2 z-10 flex items-center rounded bg-background/90 p-1">
                        <input
                          aria-label={selectLabel}
                          checked={selectedVisible.includes(post.id)}
                          disabled={busy}
                          onChange={() => toggleSelected(post.id)}
                          type="checkbox"
                        />
                      </label>
                      {imageSrc ? (
                        // Instagram CDN URLs are not in next.config remotePatterns.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={post.caption?.trim() || "Thumbnail do post"}
                          className="aspect-square w-full object-cover"
                          src={imageSrc}
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-3">
                      <p
                        className="line-clamp-2 text-sm"
                        title={post.caption ?? undefined}
                      >
                        {caption}
                      </p>
                      <p className="text-sm text-muted-foreground">{username}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPostedAt(post.postedAt)}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-2">
                        <Button
                          disabled={busy}
                          onClick={() => void handleApprove(post.id)}
                          size="sm"
                        >
                          Aprovar
                        </Button>
                        <Button
                          disabled={busy}
                          onClick={() => void handleReject(post.id)}
                          size="sm"
                          variant="destructive"
                        >
                          Rejeitar
                        </Button>
                        <Link
                          className="text-sm text-primary underline"
                          href={`/posts/${post.id}`}
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Página {filters.page ?? 1} de {Math.max(meta?.totalPages ?? 1, 1)}
            </p>
            <Button
              disabled={(filters.page ?? 1) <= 1}
              onClick={() =>
                updateUrl({ page: String(Math.max((filters.page ?? 1) - 1, 1)) })
              }
              size="sm"
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              disabled={(filters.page ?? 1) >= (meta?.totalPages ?? 1)}
              onClick={() =>
                updateUrl({ page: String((filters.page ?? 1) + 1) })
              }
              size="sm"
              variant="outline"
            >
              Próxima
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
