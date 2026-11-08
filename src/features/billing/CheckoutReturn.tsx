"use client";

import Link from "next/link";
import { useEffect, type JSX, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useInvalidateSubscription, useSubscription } from "@/features/billing/hooks";
import { formatPlanLabel } from "@/features/billing/plan-limits";

type CheckoutReturnProps =
  | { variant: "success" }
  | { variant: "cancelled" };

export function CheckoutReturn({ variant }: CheckoutReturnProps): JSX.Element {
  const invalidateSubscription = useInvalidateSubscription();
  const subscriptionQuery = useSubscription();

  useEffect(() => {
    invalidateSubscription();
  }, [invalidateSubscription]);

  if (variant === "cancelled") {
    return (
      <ReturnCard
        description="Você voltou do checkout sem concluir o pagamento. Nada foi cobrado."
        title="Pagamento não realizado"
      >
        <Button asChild type="button">
          <Link href="/billing">Tentar upgrade novamente</Link>
        </Button>
      </ReturnCard>
    );
  }

  if (subscriptionQuery.isPending) {
    return (
      <p aria-live="polite" className="text-muted-foreground">
        Confirmando seu plano…
      </p>
    );
  }

  const planLabel = subscriptionQuery.data
    ? formatPlanLabel(subscriptionQuery.data.plan)
    : "seu plano";

  return (
    <ReturnCard
      description={`Obrigado! Seu plano atual é ${planLabel}. Se o valor ainda não aparecer atualizado, aguarde alguns instantes — o webhook do Stripe pode levar um momento.`}
      title="Pagamento concluído"
    >
      <Button asChild type="button">
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </ReturnCard>
  );
}

function ReturnCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}): JSX.Element {
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
