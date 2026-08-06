"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchCampaigns,
  fetchPendingPostsMeta,
  fetchWidgets,
} from "@/features/dashboard/api";

export interface DashboardSummary {
  activeCampaigns: number;
  pendingPosts: number;
  widgets: number;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  errorMessage: string | null;
  refetch(): void;
}

export function useDashboardSummary(): DashboardSummary {
  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });
  const pendingQuery = useQuery({
    queryKey: ["posts", { status: "pending" }],
    queryFn: fetchPendingPostsMeta,
  });
  const widgetsQuery = useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });

  const firstError =
    campaignsQuery.error ?? pendingQuery.error ?? widgetsQuery.error;
  const [retryError, setRetryError] = useState<unknown>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const isFetching =
    isRetrying ||
    campaignsQuery.isFetching ||
    pendingQuery.isFetching ||
    widgetsQuery.isFetching;
  const displayedError = firstError ?? (isRetrying ? retryError : null);
  const campaigns = Array.isArray(campaignsQuery.data)
    ? campaignsQuery.data
    : [];
  const widgets = Array.isArray(widgetsQuery.data) ? widgetsQuery.data : [];

  return {
    activeCampaigns: campaigns.filter((campaign) => campaign.active).length,
    pendingPosts: pendingQuery.data?.meta?.total ?? 0,
    widgets: widgets.length,
    isLoading:
      !campaignsQuery.isFetched ||
      !pendingQuery.isFetched ||
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
        campaignsQuery.refetch(),
        pendingQuery.refetch(),
        widgetsQuery.refetch(),
      ]).finally(() => {
        setIsRetrying(false);
      });
    },
  };
}
