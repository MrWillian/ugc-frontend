"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type JSX } from "react";

async function responseMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Não foi possível concluir a conexão do Instagram.";
}

export function InstagramCallback(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const submitted = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code || !state || submitted.current) {
      return;
    }

    submitted.current = true;

    async function submitCallback() {
      try {
        const response = await fetch("/api/platform/instagram/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error(await responseMessage(response));
        }

        router.replace("/dashboard?instagram=connected");
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível concluir a conexão do Instagram.",
        );
      }
    }

    void submitCallback();
  }, [code, router, state]);

  if (!code || !state) {
    return (
      <main className="p-6">
        <p role="alert">Não foi possível validar o retorno do Instagram.</p>
        <Link className="mt-4 inline-block text-primary underline" href="/dashboard">
          Voltar ao dashboard
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <p role="alert">{error}</p>
        <Link className="mt-4 inline-block text-primary underline" href="/dashboard">
          Voltar ao dashboard
        </Link>
      </main>
    );
  }

  return <main className="p-6">Conectando Instagram...</main>;
}
