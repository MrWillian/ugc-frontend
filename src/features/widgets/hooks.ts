"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWidget,
  deleteWidget,
  fetchWidget,
  fetchWidgetPreviewPosts,
  fetchWidgets,
  updateWidget,
} from "@/features/widgets/api";
import type { CreateWidgetBody, UpdateWidgetBody } from "@/types";

export function useWidgets() {
  return useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });
}

export function useWidget(id: string) {
  return useQuery({
    queryKey: ["widgets", id],
    queryFn: () => fetchWidget(id),
    enabled: Boolean(id),
  });
}

export function useWidgetPreviewPosts(id: string) {
  return useQuery({
    queryKey: ["widget-preview", id],
    queryFn: () => fetchWidgetPreviewPosts(id),
    enabled: Boolean(id),
  });
}

export function useCreateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWidgetBody) => createWidget(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWidgetBody }) =>
      updateWidget(id, body),
    onSuccess: (_widget, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["widgets"] });
      void queryClient.invalidateQueries({ queryKey: ["widgets", id] });
    },
  });
}

export function useDeleteWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWidget(id),
    onSuccess: (_void, id) => {
      void queryClient.invalidateQueries({ queryKey: ["widgets"] });
      void queryClient.invalidateQueries({ queryKey: ["widgets", id] });
      void queryClient.invalidateQueries({ queryKey: ["widget-preview", id] });
    },
  });
}
