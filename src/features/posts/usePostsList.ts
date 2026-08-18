"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCampaigns } from "@/features/campaigns/api";
import { approvePost, fetchPosts, rejectPost } from "@/features/posts/api";
import type { ModerationQuery, RejectPostBody } from "@/types";

export function usePostsList(filters: ModerationQuery) {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: [
      "posts",
      {
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        campaignId: filters.campaignId,
      },
    ],
    queryFn: () => fetchPosts(filters),
  });

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  const approveMutation = useMutation({
    mutationFn: approvePost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      rejection_reasons,
    }: {
      id: string;
    } & RejectPostBody) => rejectPost(id, { rejection_reasons }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return { postsQuery, campaignsQuery, approveMutation, rejectMutation };
}
