"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseFiltersJson } from "@/features/widgets/filters";
import { useCreateWidget, useUpdateWidget, useWidget } from "@/features/widgets/hooks";
import { WIDGET_LAYOUT_OPTIONS } from "@/features/widgets/layout";
import {
  widgetFormSchema,
  type WidgetFormValues,
} from "@/features/widgets/schemas";
import type { CreateWidgetBody, UpdateWidgetBody } from "@/types";

type WidgetFormProps =
  | { mode: "create"; widgetId?: undefined }
  | { mode: "edit"; widgetId: string };

function requestError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

function toBody(values: WidgetFormValues): CreateWidgetBody | UpdateWidgetBody | null {
  const parsed = parseFiltersJson(values.filtersText);
  if (!parsed.ok) {
    return null;
  }
  const body: CreateWidgetBody = {
    name: values.name,
    layout: values.layout,
  };
  if (parsed.filters) {
    body.filters = parsed.filters;
  }
  return body;
}

export function WidgetForm(props: WidgetFormProps): JSX.Element {
  const router = useRouter();
  const createMutation = useCreateWidget();
  const updateMutation = useUpdateWidget();
  const widgetQuery = useWidget(props.mode === "edit" ? props.widgetId : "");
  const [requestFailure, setRequestFailure] = useState("");
  const [filtersError, setFiltersError] = useState("");
  const isEdit = props.mode === "edit";
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetFormSchema),
    defaultValues: {
      name: "",
      layout: "GRID",
      filtersText: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !widgetQuery.data) {
      return;
    }
    const widget = widgetQuery.data;
    reset({
      name: widget.name,
      layout: widget.layout,
      filtersText: widget.filters
        ? JSON.stringify(widget.filters, null, 2)
        : "",
    });
  }, [isEdit, reset, widgetQuery.data]);

  const onSubmit = async (values: WidgetFormValues) => {
    setRequestFailure("");
    setFiltersError("");
    const body = toBody(values);
    if (!body) {
      setFiltersError("JSON de filters inválido.");
      const parsed = parseFiltersJson(values.filtersText);
      if (!parsed.ok) setFiltersError(parsed.message);
      return;
    }

    try {
      if (props.mode === "edit") {
        await updateMutation.mutateAsync({
          id: props.widgetId,
          body: body as UpdateWidgetBody,
        });
        router.replace(`/widgets/${props.widgetId}`);
      } else {
        const created = await createMutation.mutateAsync(body as CreateWidgetBody);
        router.replace(`/widgets/${created.id}`);
      }
    } catch (reason) {
      setRequestFailure(requestError(reason));
    }
  };

  const heading = isEdit ? "Editar Widget" : "Novo Widget";
  const backHref = isEdit ? `/widgets/${props.widgetId}` : "/widgets";
  const header = (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <Link className="text-primary underline" href={backHref}>
        Voltar
      </Link>
    </div>
  );

  if (isEdit && widgetQuery.isPending) {
    return (
      <>
        {header}
        <p>Carregando widget...</p>
      </>
    );
  }

  if (isEdit && widgetQuery.isError) {
    return (
      <>
        {header}
        <p className="text-sm text-destructive" role="alert">
          {widgetQuery.error instanceof Error
            ? widgetQuery.error.message
            : "Widget não encontrado."}
        </p>
      </>
    );
  }

  return (
    <>
      {header}
      <form className="max-w-lg space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Label htmlFor="widget-name">Nome</Label>
          <Input
            aria-describedby={errors.name ? "widget-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            id="widget-name"
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive" id="widget-name-error" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="widget-layout">Layout</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm md:text-sm"
            id="widget-layout"
            {...register("layout")}
          >
            {WIDGET_LAYOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="widget-filters">Filters (JSON opcional)</Label>
          <Textarea
            className="font-mono text-sm"
            id="widget-filters"
            placeholder='{"maxPosts": 10}'
            {...register("filtersText")}
          />
          {filtersError ? (
            <p className="text-sm text-destructive" role="alert">
              {filtersError}
            </p>
          ) : null}
        </div>
        {requestFailure ? (
          <p className="text-sm text-destructive" role="alert">
            {requestFailure}
          </p>
        ) : null}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Enviando..." : "Salvar"}
        </Button>
      </form>
    </>
  );
}
