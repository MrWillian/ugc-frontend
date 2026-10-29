"use client";

import { useEffect, useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import type { InstagramStatus } from "@/types";

const EXPIRY_WARNING_DAYS = 7;

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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(iso),
  );
}

function expiryWarning(days: number): string {
  if (days <= 0) return "A conexão expira hoje.";
  return `A conexão expira em ${days} ${days === 1 ? "dia" : "dias"}.`;
}

export function InstagramConnectionCard({
  justConnected = false,
}: {
  justConnected?: boolean;
}): JSX.Element {
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
  const daysUntilExpiry = status?.daysUntilExpiry;

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
    <div className="space-y-3 text-sm">
      {justConnected && status?.connected && !needsReconnect ? (
        <p className="font-medium text-status-success" role="status">
          Instagram conectado com sucesso.
        </p>
      ) : null}
      {error && <p className="text-destructive" role="alert">{error}</p>}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando conexão do Instagram...</p>
      ) : !status ? (
        <Button onClick={retryStatus}>Tentar novamente</Button>
      ) : needsReconnect ? (
        <>
          <p className="text-muted-foreground">
            A conexão com o Instagram expirou ou foi revogada. Reconecte para
            continuar coletando posts.
          </p>
          <Button onClick={() => void startConnection()}>
            Reconectar Instagram
          </Button>
        </>
      ) : status.connected ? (
        <>
          <dl className="space-y-2">
            <div>
              <dt className="text-muted-foreground">Conta</dt>
              <dd className="font-medium">
                Conectado como{" "}
                {status.accountUsername ? `@${status.accountUsername}` : "Instagram"}
              </dd>
            </div>
            {status.pageName ? (
              <div>
                <dt className="text-muted-foreground">Página</dt>
                <dd className="font-medium">{status.pageName}</dd>
              </div>
            ) : null}
            {status.expiresAt ? (
              <div>
                <dt className="text-muted-foreground">Conexão válida até</dt>
                <dd className="font-medium">{formatDate(status.expiresAt)}</dd>
              </div>
            ) : null}
          </dl>
          {typeof daysUntilExpiry === "number" &&
          daysUntilExpiry <= EXPIRY_WARNING_DAYS ? (
            <>
              <p className="text-status-warning">
                {expiryWarning(daysUntilExpiry)} Reconecte para não
                interromper a coleta.
              </p>
              <Button onClick={() => void startConnection()} variant="outline">
                Reconectar Instagram
              </Button>
            </>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-muted-foreground">
            Conecte sua conta Instagram Business para coletar os posts das suas
            campanhas.
          </p>
          <Button onClick={() => void startConnection()}>Conectar Instagram</Button>
        </>
      )}
    </div>
  );
}
