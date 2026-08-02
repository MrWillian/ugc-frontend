import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstagramConnectionCard } from "@/features/instagram/InstagramConnectionCard";
import { InstagramCallback } from "@/features/instagram/InstagramCallback";

const navigationMocks = vi.hoisted(() => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => navigationMocks);

const disconnectedStatus = {
  connected: false,
  status: null,
  accountId: null,
  accountUsername: null,
  pageName: null,
  expiresAt: null,
  daysUntilExpiry: null,
  reconnectRequired: false,
};

describe("InstagramConnectionCard", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const assignMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {
      location: { assign: assignMock },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows a connect action and redirects to the OAuth URL", async () => {
    const user = userEvent.setup();
    const authUrl = "https://www.facebook.com/dialog/oauth";
    fetchMock
      .mockResolvedValueOnce(Response.json(disconnectedStatus))
      .mockResolvedValueOnce(Response.json({ authUrl, state: "client-id" }));

    render(<InstagramConnectionCard />);

    await user.click(
      await screen.findByRole("button", { name: "Conectar Instagram" }),
    );

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/platform/instagram/auth-url",
      { method: "POST" },
    );
    expect(window.location.assign).toHaveBeenCalledWith(authUrl);
  });

  it("shows the connected account username for an active connection", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...disconnectedStatus,
        connected: true,
        status: "ACTIVE",
        accountUsername: "acme",
      }),
    );

    render(<InstagramConnectionCard />);

    expect(await screen.findByText(/@acme/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Instagram/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a reconnect action when the connection requires reconnection", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...disconnectedStatus,
        connected: true,
        status: "REVOKED",
        reconnectRequired: true,
      }),
    );

    render(<InstagramConnectionCard />);

    expect(
      await screen.findByRole("button", { name: "Reconectar Instagram" }),
    ).toBeInTheDocument();
  });

  it("removes loading and offers a retry after a status API failure", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          { message: "Não foi possível consultar a conexão." },
          { status: 500 },
        ),
      )
      .mockResolvedValueOnce(Response.json(disconnectedStatus));

    render(<InstagramConnectionCard />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar a conexão.",
    );
    expect(
      screen.queryByText("Carregando conexão do Instagram..."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByRole("button", { name: "Conectar Instagram" }),
    ).toBeInTheDocument();
  });
});

describe("InstagramCallback", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const replaceMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    replaceMock.mockReset();
    navigationMocks.useRouter.mockReturnValue({ replace: replaceMock });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["code", "state"] as const)(
    "shows an error and does not submit when %s is missing",
    (missingParam) => {
      navigationMocks.useSearchParams.mockReturnValue(
        new URLSearchParams(
          missingParam === "code" ? "state=client-id" : "code=meta-code",
        ),
      );

      render(<InstagramCallback />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível validar o retorno do Instagram.",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("forwards the exact callback values and redirects after success", async () => {
    navigationMocks.useSearchParams.mockReturnValue(
      new URLSearchParams("code=meta-code&state=client-id"),
    );
    fetchMock.mockResolvedValueOnce(Response.json({}));

    render(<InstagramCallback />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/platform/instagram/callback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "meta-code", state: "client-id" }),
        },
      );
    });
    expect(replaceMock).toHaveBeenCalledWith("/dashboard?instagram=connected");
  });

  it("submits the callback only once in strict mode", async () => {
    navigationMocks.useSearchParams.mockReturnValue(
      new URLSearchParams("code=meta-code&state=client-id"),
    );
    fetchMock.mockResolvedValue(Response.json({}));

    render(
      <StrictMode>
        <InstagramCallback />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows an accessible failure with a dashboard retry link", async () => {
    navigationMocks.useSearchParams.mockReturnValue(
      new URLSearchParams("code=meta-code&state=client-id"),
    );
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { message: "Não foi possível conectar o Instagram." },
        { status: 500 },
      ),
    );

    render(<InstagramCallback />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar o Instagram.",
    );
    expect(
      screen.getByRole("link", { name: "Voltar ao dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
