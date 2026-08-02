"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { InstagramConnectionCard } from "@/features/instagram/InstagramConnectionCard";

export default function DashboardPage() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <main className="p-6">Carregando...</main>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">
        {user ? `Olá, ${user.name}` : "Dashboard"}
      </h1>
      {user ? (
        <>
          <InstagramConnectionCard />
          <Link className="mt-4 inline-block text-primary underline" href="/logout">
            Sair
          </Link>
        </>
      ) : (
        <p className="mt-4">Você não está autenticado.</p>
      )}
    </main>
  );
}
