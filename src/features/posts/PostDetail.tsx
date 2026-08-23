"use client";

import Link from "next/link";
import type { JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePostDetail } from "@/features/posts/usePostDetail";
import type {
  AuthorData,
  CollectedPost,
  DisplayStatus,
  ModerationStatus,
  RightsStatus,
} from "@/types";

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

function rightsLabel(status: RightsStatus): string {
  if (status === "GRANTED") return "concedido";
  if (status === "REJECTED") return "recusado";
  return "pendente";
}

function displayLabel(status: DisplayStatus): string {
  return status === "VISIBLE" ? "visível" : "oculto";
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function detailImage(post: CollectedPost): string | null {
  return post.contentUrl || post.thumbnailUrl || null;
}

function authorPhoto(author: AuthorData | null): string | null {
  if (!author) return null;
  const url = author.profilePictureUrl ?? author.profile_picture_url;
  return typeof url === "string" && url.trim() ? url : null;
}

function metricValue(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "—";
}

export function PostDetail({ postId }: { postId: string }): JSX.Element {
  const { postQuery, consentQuery, resendMutation, showConsent } =
    usePostDetail(postId);
  const post = postQuery.data;
  const consentUrl = consentQuery.data?.permission?.consentUrl ?? null;
  const permission = consentQuery.data?.permission;
  const canResend =
    showConsent && permission?.id && permission.channel === "EMAIL";

  async function handleCopy() {
    if (!consentUrl) return;
    await navigator.clipboard.writeText(consentUrl);
  }

  if (postQuery.isLoading) {
    return <p>Carregando post...</p>;
  }

  if (postQuery.error || !post) {
    return (
      <section>
        <p className="text-sm text-destructive" role="alert">
          {requestError(postQuery.error)}
        </p>
        <Link className="mt-4 inline-block text-primary underline" href="/posts">
          Voltar aos posts
        </Link>
      </section>
    );
  }

  const imageSrc = detailImage(post);
  const caption = post.caption?.trim() || "—";
  const username = post.authorData?.username?.trim() || "—";
  const photoSrc = authorPhoto(post.authorData);
  const history = post.moderationResults ?? [];

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Detalhes do post</h1>
        <Link className="text-primary underline" href="/posts">
          Voltar aos posts
        </Link>
      </div>

      {imageSrc ? (
        // Instagram CDN URLs are not in next.config remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={post.caption?.trim() || "Imagem do post"}
          className="max-h-[480px] w-full max-w-xl rounded object-contain"
          src={imageSrc}
        />
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Caption</h2>
        <p className="whitespace-pre-wrap">{caption}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Autor</h2>
        <div className="flex items-center gap-3">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={username}
              className="h-10 w-10 rounded-full object-cover"
              src={photoSrc}
            />
          ) : null}
          <p>{username}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Métricas</h2>
        <dl className="grid grid-cols-3 gap-4 max-w-md">
          <div>
            <dt className="text-xs text-muted-foreground">Curtidas</dt>
            <dd className="text-lg font-medium">{metricValue(post.metrics?.likes)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Comentários</dt>
            <dd className="text-lg font-medium">
              {metricValue(post.metrics?.comments)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Compartilhamentos</dt>
            <dd className="text-lg font-medium">{metricValue(post.metrics?.shares)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Status</h2>
        <div className="flex flex-col items-start gap-1">
          <Badge variant={moderationVariant(post.status)}>
            {moderationLabel(post.status)}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Direitos: {rightsLabel(post.rightsStatus)}
          </p>
          <p className="text-sm text-muted-foreground">
            Exibição: {displayLabel(post.displayStatus)}
          </p>
        </div>
      </div>

      {history.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-medium">Histórico de moderação</h2>
          <ul className="grid gap-3">
            {history.map((result) => (
              <li key={result.id} className="rounded border p-3 text-sm">
                <p>{moderationLabel(result.decision as ModerationStatus)}</p>
                {result.rejectionReasons ? <p>{result.rejectionReasons}</p> : null}
                <p className="text-muted-foreground">{formatDate(result.moderatedAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showConsent ? (
        <div className="grid gap-3 rounded border p-4">
          <h2 className="text-sm font-medium">Link de consentimento</h2>
          <p className="text-sm text-muted-foreground">
            O Instagram não entrega o e-mail do autor. Envie este link manualmente
            por DM ou e-mail.
          </p>
          {consentUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <a
                className="break-all text-primary underline"
                href={consentUrl}
                rel="noreferrer"
                target="_blank"
              >
                {consentUrl}
              </a>
              <Button onClick={() => void handleCopy()} size="sm" variant="outline">
                Copiar link
              </Button>
            </div>
          ) : consentQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando link...</p>
          ) : null}
          {canResend && permission?.id ? (
            <div>
              <Button
                disabled={resendMutation.isPending}
                onClick={() => void resendMutation.mutateAsync(permission.id)}
                size="sm"
              >
                Reenviar e-mail de consentimento
              </Button>
              {resendMutation.isSuccess ? (
                <p className="mt-2 text-sm">E-mail de consentimento reenviado.</p>
              ) : null}
              {resendMutation.error ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {requestError(resendMutation.error)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
