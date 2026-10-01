import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <AuthSplitLayout
      bullets={[
        "Coleta automática do Instagram",
        "Solicitação de direitos automatizada",
        "Widgets prontos para conversão",
      ]}
      headline="Comece em menos de 2 minutos!"
      subline="Teste grátis. Cancele a qualquer momento."
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold">Criar sua conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Experimente 14 dias grátis. Sem compromisso.
        </p>
      </div>
      <section className="rounded-xl border bg-card p-8 shadow-sm">
        <SignupForm />
        <p className="mt-6 text-center text-sm">
          Já tem conta?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Entrar
          </Link>
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3.5" />
          Você poderá cancelar a qualquer momento.
        </p>
      </section>
    </AuthSplitLayout>
  );
}
