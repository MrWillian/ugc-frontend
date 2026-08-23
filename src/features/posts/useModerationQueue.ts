"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { moderatePostsBatch } from "@/features/posts/api";
import { usePostsList } from "@/features/posts/usePostsList";
import type { ModerationQuery, RejectPostBody } from "@/types";

export function useModerationQueue(filters: ModerationQuery) {
  const queryClient = useQueryClient();
  const list = usePostsList({ ...filters, status: "pending" });

  const batchApproveMutation = useMutation({
    mutationFn: (ids: string[]) => moderatePostsBatch(ids, "approve"),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const batchRejectMutation = useMutation({
    mutationFn: ({
      ids,
      rejection_reasons,
    }: {
      ids: string[];
    } & RejectPostBody) =>
      moderatePostsBatch(ids, "reject", { rejection_reasons }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return { ...list, batchApproveMutation, batchRejectMutation };
}
