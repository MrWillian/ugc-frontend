"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isPostListStatus } from "@/features/posts/api";
import { usePostsList } from "@/features/posts/usePostsList";
import type {
  CollectedPost,
  ModerationQuery,
  ModerationStatus,
  RightsStatus,
} from "@/types";

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

function moderationLabel(status: ModerationStatus): string {
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Rejeitado";
  return "Pendente";
}

function moderationVariant(
  status: ModerationStatus,
): "default" | "secondary" | "destructive" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function consentLabel(status: RightsStatus): string {
  if (status === "GRANTED") return "concedido";
  if (status === "REJECTED") return "recusado";
  return "pendente";
}

function thumbnailSrc(post: CollectedPost): string | null {
  if (post.thumbnailUrl) return post.thumbnailUrl;
  if (post.contentType === "IMAGE") return post.contentUrl;
  return null;
}

function postsHref(
  current: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/posts?${qs}` : "/posts";
}

function filtersFromSearchParams(searchParams: URLSearchParams): ModerationQuery {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const statusParam = searchParams.get("status");
  const campaignId = searchParams.get("campaignId")?.trim() || undefined;
  const search = searchParams.get("search")?.trim() || undefined;

  return {
    page,
    limit: 20,
    status: isPostListStatus(statusParam) ? statusParam : undefined,
    campaignId,
    search,
  };
}

export function PostsList(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);
  const { postsQuery, campaignsQuery, approveMutation, rejectMutation } =
    usePostsList(filters);

  const posts = (postsQuery.data?.data ?? []).filter((post) => {
    if (!filters.search) return true;
    return (post.caption ?? "").toLowerCase().includes(filters.search.toLowerCase());
  });
  const meta = postsQuery.data?.meta;
  const campaigns = Array.isArray(campaignsQuery.data) ? campaignsQuery.data : [];
  const error =
    postsQuery.error ??
    approveMutation.error ??
    rejectMutation.error;
  const actingId = approveMutation.isPending
    ? approveMutation.variables
    : rejectMutation.isPending
      ? rejectMutation.variables?.id
      : null;

  function updateUrl(updates: Record<string, string | null>) {
    router.replace(postsHref(searchParams, updates));
  }

  async function handleApprove(postId: string) {
    await approveMutation.mutateAsync(postId);
  }

  async function handleReject(postId: string) {
    const reason = window.prompt("Motivo da rejeição");
    if (reason === null || !reason.trim()) return;
    await rejectMutation.mutateAsync({
      id: postId,
      rejection_reasons: reason.trim(),
    });
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link className="text-primary underline" href="/campaigns">
          Voltar às campanhas
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
          <Label htmlFor="status">Status</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            id="status"
            value={filters.status ?? ""}
            onChange={(event) =>
              updateUrl({ status: event.target.value, page: "1" })
            }
          >
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="search">Busca</Label>
          <Input
            id="search"
            value={filters.search ?? ""}
            onChange={(event) =>
              updateUrl({ search: event.target.value, page: "1" })
            }
            placeholder="Caption"
          />
        </div>
      </form>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {requestError(error)}
        </p>
      ) : null}
      {postsQuery.isLoading ? (
        <p>Carregando posts...</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de postagem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>Nenhum post coletado.</TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const imageSrc = thumbnailSrc(post);
                  const caption = post.caption?.trim() || "—";
                  const username = post.authorData?.username?.trim() || "—";
                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        {imageSrc ? (
                          // Instagram CDN URLs are not in next.config remotePatterns.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={post.caption?.trim() || "Thumbnail do post"}
                            className="h-12 w-12 rounded object-cover"
                            src={imageSrc}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-xs truncate" title={caption}>
                          {caption}
                        </span>
                      </TableCell>
                      <TableCell>{username}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={moderationVariant(post.status)}>
                            {moderationLabel(post.status)}
                          </Badge>
                          {post.status === "APPROVED" ? (
                            <span className="text-xs text-muted-foreground">
                              Consentimento: {consentLabel(post.rightsStatus)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{formatPostedAt(post.postedAt)}</TableCell>
                      <TableCell>
                        {post.status === "PENDING" ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              disabled={actingId === post.id}
                              onClick={() => void handleApprove(post.id)}
                              size="sm"
                            >
                              Aprovar
                            </Button>
                            <Button
                              disabled={actingId === post.id}
                              onClick={() => void handleReject(post.id)}
                              size="sm"
                              variant="destructive"
                            >
                              Rejeitar
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
              onClick={() => updateUrl({ page: String((filters.page ?? 1) + 1) })}
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
