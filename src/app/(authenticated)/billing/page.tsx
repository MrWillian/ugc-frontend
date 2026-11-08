import { PageHeader } from "@/components/patterns/PageHeader";
import { BillingPage } from "@/features/billing/BillingPage";

export default function BillingRoutePage() {
  return (
    <>
      <PageHeader
        description="Compare planos, faça upgrade e gerencie sua assinatura."
        title="Planos"
      />
      <BillingPage />
    </>
  );
}
