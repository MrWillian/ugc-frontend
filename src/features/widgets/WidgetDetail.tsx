"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import { CopyEmbedField } from "@/features/widgets/CopyEmbedField";
import { widgetEmbedCode } from "@/features/widgets/embed";
import {
  useDeleteWidget,
  useWidget,
  useWidgetPreviewPosts,
} from "@/features/widgets/hooks";
import { layoutLabel } from "@/features/widgets/layout";
import { WidgetPreview } from "@/features/widgets/WidgetPreview";

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

export function WidgetDetail(props: { widgetId: string }): JSX.Element {
  const router = useRouter();
  const widgetQuery = useWidget(props.widgetId);
  const previewQuery = useWidgetPreviewPosts(props.widgetId);
  const deleteMutation = useDeleteWidget();
  const [actionError, setActionError] = useState("");

  async function onDelete() {
    if (!window.confirm("Excluir este widget?")) {
      return;
    }
    setActionError("");
    try {
      await deleteMutation.mutateAsync(props.widgetId);
      router.replace("/widgets");
    } catch (reason) {
      const message = requestError(reason);
      if (
        message.toLowerCase().includes("não encontrado") ||
        message.toLowerCase().includes("not found")
      ) {
        router.replace("/widgets");
        return;
      }
      setActionError(message);
    }
  }

  if (widgetQuery.isPending) {
    return <p>Carregando widget...</p>;
  }

  if (widgetQuery.isError || !widgetQuery.data) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Widget não encontrado.
      </p>
    );
  }

  const widget = widgetQuery.data;
  const filtersSummary = widget.filters
    ? JSON.stringify(widget.filters, null, 2)
    : "Nenhum";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{widget.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/widgets/${widget.id}/edit`}>Editar</Link>
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => void onDelete()}
            type="button"
            variant="destructive"
          >
            Excluir
          </Button>
          <Link className="text-primary underline" href="/widgets">
            Voltar aos widgets
          </Link>
        </div>
      </div>
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Layout</dt>
          <dd>{layoutLabel(widget.layout)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Filters</dt>
          <dd>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {filtersSummary}
            </pre>
          </dd>
        </div>
      </dl>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Código de embed</h2>
        <CopyEmbedField
          embedCode={widgetEmbedCode(widget)}
          id={`embed-detail-${widget.id}`}
        />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Prévia</h2>
        <WidgetPreview
          errorMessage={
            previewQuery.isError
              ? previewQuery.error instanceof Error
                ? previewQuery.error.message
                : "Não foi possível carregar a prévia."
              : null
          }
          isLoading={previewQuery.isPending}
          layout={widget.layout}
          posts={Array.isArray(previewQuery.data) ? previewQuery.data : []}
        />
      </div>
    </section>
  );
}
