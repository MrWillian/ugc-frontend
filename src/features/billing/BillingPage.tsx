"use client";

import { useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import {
  CHECKOUT_PLAN_ORDER,
  PLAN_DISPLAY_NAMES,
  PLAN_TIER_LIMITS,
  checkoutPlanForCurrentPlan,
  formatPlanLabel,
  subscriptionStatusLabel,
} from "@/features/billing/plan-limits";
import {
  useCancelSubscription,
  useCreateCheckout,
  useSubscription,
} from "@/features/billing/hooks";
import type { CheckoutPlan } from "@/types";

function formatRenewalDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(date);
}

function requestErrorMessage(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Não foi possível concluir a solicitação.";
}

export function BillingPage(): JSX.Element {
  const subscriptionQuery = useSubscription();
  const checkoutMutation = useCreateCheckout();
  const cancelMutation = useCancelSubscription();
  const [checkoutErrors, setCheckoutErrors] = useState<Partial<Record<CheckoutPlan, string>>>(
    {},
  );
  const [cancelError, setCancelError] = useState("");

  const onUpgradeClick = (plan: CheckoutPlan) => {
    setCheckoutErrors((prev) => {
      const next = { ...prev };
      delete next[plan];
      return next;
    });
    checkoutMutation.mutate(plan, {
      onError: (error) => {
        setCheckoutErrors((prev) => ({
          ...prev,
          [plan]: requestErrorMessage(error),
        }));
      },
    });
  };

  const handleCancel = async () => {
    setCancelError("");
    const confirmed = window.confirm(
      "Cancelar a assinatura? Sua conta será rebaixada para o plano Starter.",
    );
    if (!confirmed) {
      return;
    }

    try {
      await cancelMutation.mutateAsync();
    } catch (reason) {
      setCancelError(requestErrorMessage(reason));
    }
  };

  if (subscriptionQuery.isPending) {
    return (
      <p aria-live="polite" className="text-muted-foreground">
        Carregando assinatura…
      </p>
    );
  }

  if (subscriptionQuery.isError) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm" role="alert">
        <p className="text-sm text-destructive">{requestErrorMessage(subscriptionQuery.error)}</p>
        <Button
          className="mt-4"
          type="button"
          variant="outline"
          onClick={() => void subscriptionQuery.refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const subscription = subscriptionQuery.data;
  const currentCheckoutPlan = checkoutPlanForCurrentPlan(subscription.plan);
  const statusLabel = subscriptionStatusLabel(subscription.subscriptionStatus);
  const hasActiveStripeSubscription = Boolean(subscription.stripeSubscriptionId);
  const checkoutPendingPlan = checkoutMutation.isPending
    ? checkoutMutation.variables
    : null;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Plano atual</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Plano</dt>
            <dd className="text-base font-semibold">{formatPlanLabel(subscription.plan)}</dd>
          </div>
          {statusLabel ? (
            <div>
              <dt className="text-muted-foreground">Status da assinatura</dt>
              <dd className="font-medium">{statusLabel}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Próxima renovação</dt>
            <dd className="font-medium">
              {subscription.currentPeriodEnd
                ? formatRenewalDate(subscription.currentPeriodEnd)
                : "Sem cobrança recorrente neste plano."}
            </dd>
          </div>
        </dl>
        {hasActiveStripeSubscription ? (
          <CancelSection
            cancelError={cancelError}
            isCanceling={cancelMutation.isPending}
            onCancel={() => void handleCancel()}
          />
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Comparar planos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Limites de campanhas ativas, posts coletados por mês e widgets.
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {CHECKOUT_PLAN_ORDER.map((plan) => {
            const limits = PLAN_TIER_LIMITS[plan];
            const isCurrent = plan === currentCheckoutPlan;
            const checkoutError = checkoutErrors[plan];

            return (
              <li
                key={plan}
                className={`flex flex-col rounded-xl border bg-card p-5 shadow-sm ${
                  isCurrent ? "border-primary ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{PLAN_DISPLAY_NAMES[plan]}</h3>
                  {isCurrent ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Seu plano
                    </span>
                  ) : null}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  <li>{limits.activeCampaigns} campanha(s) ativa(s)</li>
                  <li>{limits.postsPerMonth.toLocaleString("pt-BR")} posts/mês</li>
                  <li>{limits.widgets} widget(s)</li>
                </ul>
                <Button
                  aria-busy={checkoutPendingPlan === plan}
                  className="mt-6 w-full"
                  disabled={isCurrent || checkoutPendingPlan !== null}
                  type="button"
                  onClick={() => onUpgradeClick(plan)}
                >
                  {checkoutPendingPlan === plan ? "Abrindo checkout…" : "Fazer upgrade"}
                </Button>
                {checkoutError ? (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {checkoutError}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function CancelSection({
  cancelError,
  isCanceling,
  onCancel,
}: {
  cancelError: string;
  isCanceling: boolean;
  onCancel: () => void;
}): JSX.Element {
  return (
    <div className="mt-6 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Você pode cancelar a assinatura pelo dashboard. A conta passará para o plano Starter.
      </p>
      <Button
        className="mt-3"
        disabled={isCanceling}
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        {isCanceling ? "Cancelando…" : "Cancelar assinatura"}
      </Button>
      {cancelError ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {cancelError}
        </p>
      ) : null}
    </div>
  );
}
