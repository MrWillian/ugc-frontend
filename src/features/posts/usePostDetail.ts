"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchConsentStatus,
  fetchPost,
  resendConsent,
} from "@/features/posts/api";

export function usePostDetail(postId: string) {
  const postQuery = useQuery({
    queryKey: ["posts", postId],
    queryFn: () => fetchPost(postId),
    retry: false,
  });

  const showConsent =
    postQuery.data?.status === "APPROVED" &&
    postQuery.data?.rightsStatus === "PENDING";

  const consentQuery = useQuery({
    queryKey: ["posts", postId, "consent"],
    queryFn: () => fetchConsentStatus(postId),
    enabled: showConsent,
    retry: false,
  });

  const resendMutation = useMutation({
    mutationFn: resendConsent,
  });

  return { postQuery, consentQuery, resendMutation, showConsent };
}
