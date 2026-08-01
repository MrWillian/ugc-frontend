import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { Client } from "@/types";

const client: Client = {
  id: "client-1",
  email: "owner@acme.test",
  name: "Acme Owner",
  subdomain: "acme",
  plan: "STARTER",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: "active",
  currentPeriodEnd: null,
  companyName: "Acme",
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
};

function SessionProbe() {
  const auth = useAuth();
  const [error, setError] = useState("");

  const run = (action: () => Promise<void>) => {
    void action().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : String(reason));
    });
  };

  return (
    <>
      <div>{auth.isLoading ? "Carregando" : "Pronto"}</div>
      <div>{auth.user?.email}</div>
      <div>{auth.user?.name}</div>
      <div role="alert">{error}</div>
      <button onClick={() => run(() => auth.login("owner@acme.test", "secret"))}>
        Entrar
      </button>
      <button
        onClick={() =>
          run(() => auth.signup("Acme Owner", "owner@acme.test", "secret", "acme"))
        }
      >
        Criar conta
      </button>
      <button onClick={() => run(auth.logout)}>Sair</button>
    </>
  );
}

describe("AuthProvider", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("hydrates the client from the internal me route", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ client }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText(client.email)).toBeInTheDocument();
    expect(screen.getByText("Pronto")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      credentials: "same-origin",
    });
  });

  it("finishes hydration as anonymous when the me request fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network unavailable"));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("Pronto")).toBeInTheDocument();
    expect(screen.queryByText(client.email)).not.toBeInTheDocument();
  });

  it("stores the returned client after login", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ message: "Não autenticado." }, { status: 401 }),
      )
      .mockResolvedValueOnce(Response.json({ client }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await screen.findByText("Pronto");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText(client.name)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "owner@acme.test",
          password: "secret",
        }),
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });

  it("stores the returned client after signup", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ message: "Não autenticado." }, { status: 401 }),
      )
      .mockResolvedValueOnce(Response.json({ client }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await screen.findByText("Pronto");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByText(client.email)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        body: JSON.stringify({
          name: "Acme Owner",
          email: "owner@acme.test",
          password: "secret",
          subdomain: "acme",
        }),
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });

  it("rejects a failed login with the returned message", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ message: "Não autenticado." }, { status: 401 }),
      )
      .mockResolvedValueOnce(
        Response.json({ message: "Credenciais inválidas." }, { status: 401 }),
      );

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await screen.findByText("Pronto");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credenciais inválidas.",
    );
  });

  it("clears the client when logout fails", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ client }))
      .mockRejectedValueOnce(new Error("network unavailable"));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    expect(await screen.findByText(client.email)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => {
      expect(screen.queryByText(client.email)).not.toBeInTheDocument();
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "network unavailable",
    );
  });

  it("aborts pending login before logout and does not restore stale state", async () => {
    let resolveLogin!: (response: Response) => void;
    let loginSignal!: AbortSignal;
    const login = new Promise<Response>((resolve) => {
      resolveLogin = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ message: "Não autenticado." }, { status: 401 }),
      )
      .mockImplementationOnce((_input, init) => {
        loginSignal = (init as RequestInit).signal as AbortSignal;
        return login;
      })
      .mockResolvedValueOnce(Response.json({ ok: true }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await screen.findByText("Pronto");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(loginSignal.aborted).toBe(true);

    await act(async () => {
      resolveLogin(Response.json({ client }));
      await login;
    });

    expect(screen.queryByText(client.email)).not.toBeInTheDocument();
  });

  it("aborts pending signup before logout and does not restore stale state", async () => {
    let resolveSignup!: (response: Response) => void;
    let signupSignal!: AbortSignal;
    const signup = new Promise<Response>((resolve) => {
      resolveSignup = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ message: "Não autenticado." }, { status: 401 }),
      )
      .mockImplementationOnce((_input, init) => {
        signupSignal = (init as RequestInit).signal as AbortSignal;
        return signup;
      })
      .mockResolvedValueOnce(Response.json({ ok: true }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await screen.findByText("Pronto");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(signupSignal.aborted).toBe(true);

    await act(async () => {
      resolveSignup(Response.json({ client }));
      await signup;
    });

    expect(screen.queryByText(client.email)).not.toBeInTheDocument();
  });

  it("does not surface an invalidated login abort as an error", async () => {
    let loginSignal: AbortSignal | undefined;
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ message: "Não autenticado." }, { status: 401 }),
      )
      .mockImplementationOnce((_input, init) => {
        loginSignal = (init as RequestInit).signal as AbortSignal | undefined;
        return new Promise<Response>((_resolve, reject) => {
          // The browser fetch implementation rejects as soon as its signal aborts.
          // The provider must handle that invalidation as a silent cancellation.
          loginSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("The operation was aborted.", "AbortError")),
            { once: true },
          );
        });
      })
      .mockResolvedValueOnce(Response.json({ ok: true }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await screen.findByText("Pronto");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(loginSignal?.aborted).toBe(true);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    });
  });

  it("does not restore the client when hydration resolves after logout", async () => {
    let resolveHydration!: (response: Response) => void;
    const hydration = new Promise<Response>((resolve) => {
      resolveHydration = resolve;
    });
    fetchMock
      .mockReturnValueOnce(hydration)
      .mockResolvedValueOnce(Response.json({ ok: true }));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/auth/logout", {
        credentials: "same-origin",
        method: "POST",
      });
    });

    await act(async () => {
      resolveHydration(Response.json({ client }));
      await hydration;
    });

    expect(await screen.findByText("Pronto")).toBeInTheDocument();
    expect(screen.queryByText(client.email)).not.toBeInTheDocument();
  });
});
