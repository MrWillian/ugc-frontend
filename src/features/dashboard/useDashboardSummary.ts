"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchAllPostsMeta,
  fetchApprovedPostsMeta,
  fetchPendingPostsMeta,
  fetchWidgets,
} from "@/features/dashboard/api";
import { fetchPostSample, POST_SAMPLE_CAP } from "@/features/dashboard/post-sample";
import { countCreatedToday } from "@/features/dashboard/bucket-posts-by-day";

export interface DashboardSummary {
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  widgets: number;
  todayCollected: number | null;
  todayPending: number | null;
  todayApproved: number | null;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  errorMessage: string | null;
  refetch(): void;
}

export function useDashboardSummary(): DashboardSummary {
  const allQuery = useQuery({
    queryKey: ["posts", { scope: "all-meta" }],
    queryFn: fetchAllPostsMeta,
  });
  const pendingQuery = useQuery({
    queryKey: ["posts", { status: "pending" }],
    queryFn: fetchPendingPostsMeta,
  });
  const approvedQuery = useQuery({
    queryKey: ["posts", { status: "approved" }],
    queryFn: fetchApprovedPostsMeta,
  });
  const widgetsQuery = useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });
  const sampleQuery = useQuery({
    queryKey: ["posts", { scope: "dashboard-sample" }],
    queryFn: () => fetchPostSample(POST_SAMPLE_CAP),
  });

  const firstError =
    allQuery.error ??
    pendingQuery.error ??
    approvedQuery.error ??
    widgetsQuery.error;
  const [retryError, setRetryError] = useState<unknown>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const isFetching =
    isRetrying ||
    allQuery.isFetching ||
    pendingQuery.isFetching ||
    approvedQuery.isFetching ||
    widgetsQuery.isFetching;
  const displayedError = firstError ?? (isRetrying ? retryError : null);
  const widgets = Array.isArray(widgetsQuery.data) ? widgetsQuery.data : [];
  const sample = sampleQuery.data ?? [];
  const sampleCapped = sample.length >= POST_SAMPLE_CAP;

  function todaySubtext(count: number): number | null {
    if (sampleCapped) return null;
    return count > 0 ? count : null;
  }

  return {
    totalPosts: allQuery.data?.meta?.total ?? 0,
    pendingPosts: pendingQuery.data?.meta?.total ?? 0,
    approvedPosts: approvedQuery.data?.meta?.total ?? 0,
    widgets: widgets.length,
    todayCollected: todaySubtext(countCreatedToday(sample)),
    todayPending: todaySubtext(
      countCreatedToday(sample, new Date(), (p) => p.status === "PENDING"),
    ),
    todayApproved: todaySubtext(
      countCreatedToday(sample, new Date(), (p) => p.status === "APPROVED"),
    ),
    isLoading:
      !allQuery.isFetched ||
      !pendingQuery.isFetched ||
      !approvedQuery.isFetched ||
      !widgetsQuery.isFetched,
    isError: Boolean(displayedError),
    isFetching,
    errorMessage:
      displayedError instanceof Error
        ? displayedError.message
        : displayedError
          ? "Não foi possível carregar o resumo."
          : null,
    refetch() {
      setRetryError(firstError);
      setIsRetrying(true);
      void Promise.all([
        allQuery.refetch(),
        pendingQuery.refetch(),
        approvedQuery.refetch(),
        widgetsQuery.refetch(),
        sampleQuery.refetch(),
      ]).finally(() => {
        setIsRetrying(false);
      });
    },
  };
}
