import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PostsList } from "@/features/posts/PostsList";
import type { Campaign, CollectedPost, PaginatedResponse } from "@/types";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams,
}));

const campaign: Campaign = {
  id: "campaign-1",
  clientId: "client-1",
  name: "Campanha verão",
  hashtag: "Verao_2026",
  termsText: "Termos",
  active: true,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

function makePost(overrides: Partial<CollectedPost> = {}): CollectedPost {
  return {
    id: "post-1",
    campaignId: "campaign-1",
    platform: "INSTAGRAM",
    externalId: "ext-1",
    contentType: "IMAGE",
    contentUrl: "https://cdn.example/full.jpg",
    thumbnailUrl: "https://cdn.example/thumb.jpg",
    caption: "Praia no verão com o produto",
    authorData: { username: "ana.ugc" },
    metrics: null,
    postedAt: "2026-08-10T15:30:00.000Z",
    status: "PENDING",
    rightsStatus: "PENDING",
    displayStatus: "HIDDEN",
    createdAt: "2026-08-10T16:00:00.000Z",
    updatedAt: "2026-08-10T16:00:00.000Z",
    ...overrides,
  };
}

function paginated(
  data: CollectedPost[],
  meta: Partial<PaginatedResponse<CollectedPost>["meta"]> = {},
): PaginatedResponse<CollectedPost> {
  return {
    data,
    meta: { page: 1, limit: 20, total: data.length, totalPages: 1, ...meta },
  };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, init);
}

function renderList() {
  return render(
    <QueryProvider>
      <PostsList />
    </QueryProvider>,
  );
}

describe("PostsList", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    navigationMocks.replace.mockReset();
    navigationMocks.searchParams = new URLSearchParams();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders collected posts in a table and fetches the default page", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(paginated([makePost()]));
      }
      if (url === "/api/campaigns") {
        return jsonResponse([campaign]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderList();

    expect(await screen.findByRole("columnheader", { name: "Thumbnail" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar às campanhas" })).toHaveAttribute(
      "href",
      "/campaigns",
    );
    expect(screen.getByRole("columnheader", { name: "Caption" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Autor" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Data de postagem" })).toBeInTheDocument();

    const row = screen.getByRole("row", { name: /ana.ugc/ });
    expect(within(row).getByRole("img", { name: "Praia no verão com o produto" })).toHaveAttribute(
      "src",
      "https://cdn.example/thumb.jpg",
    );
    expect(within(row).getByText("Praia no verão com o produto")).toBeInTheDocument();
    expect(within(row).getByText("ana.ugc")).toBeInTheDocument();
    expect(within(row).getByText("Pendente")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Aprovar" })).toHaveClass("cursor-pointer");
    expect(within(row).getByRole("button", { name: "Rejeitar" })).toHaveClass("cursor-pointer");

    expect(fetchMock).toHaveBeenCalledWith("/api/posts?page=1&limit=20", {
      credentials: "same-origin",
    });
  });

  it("lists a campaign via GET /api/campaigns/:id/posts without campaignId or search query params", async () => {
    navigationMocks.searchParams = new URLSearchParams(
      "page=2&status=pending&campaignId=campaign-1&search=praia",
    );
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/campaigns/campaign-1/posts?")) {
        return jsonResponse(
          paginated(
            [
              makePost(),
              makePost({
                id: "post-2",
                caption: "Outro caption",
                authorData: { username: "outra.ugc" },
              }),
            ],
            { page: 2, total: 21, totalPages: 2 },
          ),
        );
      }
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderList();

    expect(await screen.findByText("ana.ugc")).toBeInTheDocument();
    expect(screen.queryByText("outra.ugc")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/posts?page=2&limit=20&status=pending",
      { credentials: "same-origin" },
    );
  });

  it("filters the current page by caption without sending search to the API", async () => {
    navigationMocks.searchParams = new URLSearchParams("search=praia");
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(
          paginated([
            makePost(),
            makePost({
              id: "post-2",
              caption: "Outro caption",
              authorData: { username: "outra.ugc" },
            }),
          ]),
        );
      }
      return jsonResponse([campaign]);
    });

    renderList();

    expect(await screen.findByText("ana.ugc")).toBeInTheDocument();
    expect(screen.queryByText("outra.ugc")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/posts?page=1&limit=20", {
      credentials: "same-origin",
    });
  });

  it("writes the campaign filter to the URL and resets the page", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(paginated([makePost()], { page: 3, total: 50, totalPages: 3 }));
      }
      return jsonResponse([campaign]);
    });
    navigationMocks.searchParams = new URLSearchParams("page=3");

    renderList();
    await screen.findByText("ana.ugc");

    await user.selectOptions(screen.getByLabelText("Campanha"), "campaign-1");
    expect(navigationMocks.replace).toHaveBeenCalledWith("/posts?page=1&campaignId=campaign-1");
  });

  it("writes the status filter to the URL and resets the page", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(paginated([makePost()], { page: 3, total: 50, totalPages: 3 }));
      }
      return jsonResponse([campaign]);
    });
    navigationMocks.searchParams = new URLSearchParams("page=3");

    renderList();
    await screen.findByText("ana.ugc");

    await user.selectOptions(screen.getByLabelText("Status"), "approved");
    expect(navigationMocks.replace).toHaveBeenCalledWith("/posts?page=1&status=approved");
  });

  it("approves a pending post and refetches the list", async () => {
    const user = userEvent.setup();
    const pending = makePost();
    const approved = makePost({ status: "APPROVED", rightsStatus: "PENDING" });
    let postsCalls = 0;

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      if (url === "/api/posts/post-1/approve") {
        expect(init).toEqual(expect.objectContaining({ method: "POST" }));
        return jsonResponse({ ...approved, consent_link: "https://api.test/consent?token=abc" });
      }
      if (url.startsWith("/api/posts?")) {
        postsCalls += 1;
        return jsonResponse(paginated([postsCalls === 1 ? pending : approved]));
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderList();
    await user.click(await screen.findByRole("button", { name: "Aprovar" }));

    await waitFor(() => {
      const row = screen.getByRole("row", { name: /ana.ugc/ });
      expect(within(row).getByText("Aprovado")).toBeInTheDocument();
      expect(within(row).getByText(/Consentimento: pendente/i)).toBeInTheDocument();
      expect(within(row).queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/posts/post-1/approve",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });

  it("rejects a pending post with a reason and refetches the list", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue("Fora do briefing");
    const pending = makePost();
    const rejected = makePost({ status: "REJECTED", rightsStatus: "REJECTED" });
    let postsCalls = 0;

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      if (url === "/api/posts/post-1/reject") {
        return jsonResponse(rejected);
      }
      if (url.startsWith("/api/posts?")) {
        postsCalls += 1;
        return jsonResponse(paginated([postsCalls === 1 ? pending : rejected]));
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderList();
    await user.click(await screen.findByRole("button", { name: "Rejeitar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/posts/post-1/reject",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ rejection_reasons: "Fora do briefing" }),
      }),
    );
    await waitFor(() => {
      const row = screen.getByRole("row", { name: /ana.ugc/ });
      expect(within(row).getByText("Rejeitado")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Consentimento/i)).not.toBeInTheDocument();
  });

  it("does not reject when the reason prompt is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue(null);
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) return jsonResponse(paginated([makePost()]));
      return jsonResponse([campaign]);
    });

    renderList();
    await user.click(await screen.findByRole("button", { name: "Rejeitar" }));

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/posts/post-1/reject",
      expect.anything(),
    );
  });

  it("shows consent status for approved posts", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(
          paginated([
            makePost({
              id: "post-granted",
              status: "APPROVED",
              rightsStatus: "GRANTED",
              authorData: { username: "granted.user" },
            }),
          ]),
        );
      }
      return jsonResponse([campaign]);
    });

    renderList();

    const row = await screen.findByRole("row", { name: /granted.user/ });
    expect(within(row).getByText("Aprovado")).toBeInTheDocument();
    expect(within(row).getByText(/Consentimento: concedido/i)).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
  });

  it("paginates by writing page to the URL", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(paginated([makePost()], { total: 40, totalPages: 2 }));
      }
      return jsonResponse([campaign]);
    });

    renderList();
    await screen.findByText("ana.ugc");
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(navigationMocks.replace).toHaveBeenCalledWith("/posts?page=2");
  });

  it("shows an empty state when there are no posts", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) return jsonResponse(paginated([]));
      return jsonResponse([campaign]);
    });

    renderList();

    expect(await screen.findByText("Nenhum post coletado.")).toBeInTheDocument();
  });

  it("shows an error when the list request fails", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse({ message: "Falha ao carregar posts." }, { status: 500 });
      }
      return jsonResponse([campaign]);
    });

    renderList();

    expect(await screen.findByRole("alert", {}, { timeout: 3_000 })).toHaveTextContent(
      "Falha ao carregar posts.",
    );
  });
});
