"use client";

import Link from "next/link";
import type { JSX } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyEmbedField } from "@/features/widgets/CopyEmbedField";
import { widgetEmbedCode } from "@/features/widgets/embed";
import { useWidgets } from "@/features/widgets/hooks";
import { layoutLabel } from "@/features/widgets/layout";

export function WidgetsList(): JSX.Element {
  const query = useWidgets();
  const widgets = Array.isArray(query.data) ? query.data : [];

  return (
    <section>
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/widgets/new">Novo widget</Link>
          </Button>
        }
        description="Embeds para exibir posts aprovados no seu site."
        title="Widgets"
      />
      {query.isError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {query.error instanceof Error
            ? query.error.message
            : "Não foi possível concluir a solicitação."}
        </p>
      ) : null}
      {query.isPending ? (
        <p>Carregando widgets...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Layout</TableHead>
              <TableHead>Código de Embed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {widgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>Nenhum widget cadastrado.</TableCell>
              </TableRow>
            ) : (
              widgets.map((widget) => (
                <TableRow key={widget.id}>
                  <TableCell>
                    <Link
                      className="text-primary underline"
                      href={`/widgets/${widget.id}`}
                    >
                      {widget.name}
                    </Link>
                  </TableCell>
                  <TableCell>{layoutLabel(widget.layout)}</TableCell>
                  <TableCell>
                    <CopyEmbedField
                      embedCode={widgetEmbedCode(widget)}
                      id={`embed-${widget.id}`}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      )}
    </section>
  );
}
