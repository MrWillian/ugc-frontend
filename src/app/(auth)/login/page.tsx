import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthSplitLayout
      headline="Transforme clientes em prova social real"
      subline="Acesse sua conta e continue convertendo visitantes em compradores."
    >
      <section className="rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold">Entrar</h1>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm">
          Ainda não tem conta?{" "}
          <Link className="font-medium text-primary hover:underline" href="/signup">
            Criar conta
          </Link>
        </p>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3.5" />
          Seus dados são protegidos com criptografia SSL.
        </p>
      </section>
    </AuthSplitLayout>
  );
}
