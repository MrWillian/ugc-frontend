"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Client } from "@/types";

export interface AuthContextValue {
  user: Client | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  signup(
    name: string,
    email: string,
    password: string,
    subdomain: string,
  ): Promise<void>;
  logout(): Promise<void>;
}

interface ClientResponse {
  client: Client;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function responseMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);

  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body
  ) {
    const { message } = body as { message?: unknown };

    if (Array.isArray(message)) {
      return message.filter((item): item is string => typeof item === "string").join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Não foi possível concluir a solicitação.";
}

async function clientMutation(
  path: "/api/auth/login" | "/api/auth/signup",
  body: Record<string, string>,
  signal: AbortSignal,
): Promise<Client> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  const payload = await response.json() as ClientResponse;
  return payload.client;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionVersion = useRef(0);
  const pendingMutations = useRef(new Set<AbortController>());

  useEffect(() => {
    let active = true;
    const hydrationVersion = sessionVersion.current;

    async function hydrate() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });

        if (response.ok) {
          const payload = await response.json() as ClientResponse;
          if (
            active &&
            sessionVersion.current === hydrationVersion
          ) {
            setUser(payload.client);
          }
        }
      } catch {
        // A failed session check represents an anonymous browser session.
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(email, password) {
        sessionVersion.current += 1;
        const mutationVersion = sessionVersion.current;
        const controller = new AbortController();
        pendingMutations.current.add(controller);

        try {
          const client = await clientMutation(
            "/api/auth/login",
            { email, password },
            controller.signal,
          );
          if (sessionVersion.current === mutationVersion) {
            setUser(client);
          }
        } catch (error) {
          if (
            controller.signal.aborted &&
            sessionVersion.current !== mutationVersion
          ) {
            return;
          }
          throw error;
        } finally {
          pendingMutations.current.delete(controller);
        }
      },
      async signup(name, email, password, subdomain) {
        sessionVersion.current += 1;
        const mutationVersion = sessionVersion.current;
        const controller = new AbortController();
        pendingMutations.current.add(controller);

        try {
          const client = await clientMutation(
            "/api/auth/signup",
            {
              name,
              email,
              password,
              subdomain,
            },
            controller.signal,
          );
          if (sessionVersion.current === mutationVersion) {
            setUser(client);
          }
        } catch (error) {
          if (
            controller.signal.aborted &&
            sessionVersion.current !== mutationVersion
          ) {
            return;
          }
          throw error;
        } finally {
          pendingMutations.current.delete(controller);
        }
      },
      async logout() {
        sessionVersion.current += 1;
        for (const controller of pendingMutations.current) {
          controller.abort();
        }
        try {
          const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
          });

          if (!response.ok) {
            throw new Error(await responseMessage(response));
          }
        } finally {
          setUser(null);
        }
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
