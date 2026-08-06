"use client";

import { useQuery } from "@tanstack/react-query";
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

  return {
    activeCampaigns:
      campaignsQuery.data?.filter((campaign) => campaign.active).length ?? 0,
    pendingPosts: pendingQuery.data?.meta.total ?? 0,
    widgets: widgetsQuery.data?.length ?? 0,
    isLoading:
      campaignsQuery.isPending ||
      pendingQuery.isPending ||
      widgetsQuery.isPending,
    isError: Boolean(firstError),
    errorMessage:
      firstError instanceof Error
        ? firstError.message
        : firstError
          ? "Não foi possível carregar o resumo."
          : null,
    refetch() {
      void campaignsQuery.refetch();
      void pendingQuery.refetch();
      void widgetsQuery.refetch();
    },
  };
}
