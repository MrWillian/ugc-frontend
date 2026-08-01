import Link from "next/link";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece a organizar seu conteúdo gerado por usuários.
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm">
          Já tem conta?{" "}
          <Link className="text-primary underline" href="/login">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
