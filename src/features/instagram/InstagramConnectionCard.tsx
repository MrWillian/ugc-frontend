"use client";

import { useEffect, useState, type JSX } from "react";
import { Button } from "@/components/ui/button";

interface InstagramStatus {
  connected: boolean;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | null;
  accountId: string | null;
  accountUsername: string | null;
  pageName: string | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  reconnectRequired: boolean;
}

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

  return "Não foi possível concluir a solicitação.";
}

export function InstagramConnectionCard(): JSX.Element {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/platform/instagram/status");

        if (!response.ok) {
          throw new Error(await responseMessage(response));
        }

        const payload = (await response.json()) as InstagramStatus;
        if (active) {
          setStatus(payload);
          setError("");
        }
      } catch (reason) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar a conexão do Instagram.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadStatus();
    return () => {
      active = false;
    };
  }, [reloadVersion]);

  const needsReconnect =
    status?.reconnectRequired ||
    status?.status === "EXPIRED" ||
    status?.status === "REVOKED";

  async function startConnection() {
    setError("");

    try {
      const response = await fetch("/api/platform/instagram/auth-url", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      const payload = (await response.json()) as { authUrl: string };
      window.location.assign(payload.authUrl);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível iniciar a conexão do Instagram.",
      );
    }
  }

  function retryStatus() {
    setError("");
    setReloadVersion((version) => version + 1);
  }

  return (
    <section className="mt-6 rounded-lg border p-4" aria-labelledby="instagram-heading">
      <h2 id="instagram-heading" className="text-lg font-semibold">
        Instagram
      </h2>
      {error && <p className="mt-2 text-destructive" role="alert">{error}</p>}
      {isLoading ? (
        <p className="mt-2">Carregando conexão do Instagram...</p>
      ) : !status ? (
        <Button className="mt-4" onClick={retryStatus}>
          Tentar novamente
        </Button>
      ) : needsReconnect ? (
        <Button className="mt-4" onClick={() => void startConnection()}>
          Reconectar Instagram
        </Button>
      ) : status.connected ? (
        <p className="mt-2">
          Conectado como {status.accountUsername ? `@${status.accountUsername}` : "Instagram"}
        </p>
      ) : (
        <Button className="mt-4" onClick={() => void startConnection()}>
          Conectar Instagram
        </Button>
      )}
    </section>
  );
}
