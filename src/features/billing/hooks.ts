"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSubscription,
  createCheckoutSession,
  fetchCurrentSubscription,
} from "@/features/billing/api";
import type { CheckoutPlan } from "@/types";

export const subscriptionQueryKey = ["subscription"] as const;

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionQueryKey,
    queryFn: fetchCurrentSubscription,
    retry: false,
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (plan: CheckoutPlan) => createCheckoutSession(plan),
    onSuccess: (data) => {
      window.location.assign(data.url);
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
    },
  });
}

export function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
  };
}
