import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesse sua conta para continuar.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm">
          Ainda não tem conta?{" "}
          <Link className="text-primary underline" href="/signup">
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
