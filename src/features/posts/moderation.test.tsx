import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ModerationQueue } from "@/features/posts/ModerationQueue";
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
    authorData: {
      username: "ana.ugc",
      profilePictureUrl: "https://cdn.example/ana.jpg",
    },
    metrics: { likes: 12, comments: 3, shares: 1 },
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

function renderQueue() {
  return render(
    <QueryProvider>
      <ModerationQueue />
    </QueryProvider>,
  );
}

describe("ModerationQueue", () => {
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

  it("renders pending posts as cards and always fetches status=pending", async () => {
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

    renderQueue();

    expect(await screen.findByRole("heading", { name: "Moderação" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos os posts" })).toHaveAttribute(
      "href",
      "/posts",
    );

    const card = await screen.findByRole("article", { name: /ana.ugc/ });
    expect(within(card).getByRole("img", { name: "Praia no verão com o produto" })).toHaveAttribute(
      "src",
      "https://cdn.example/thumb.jpg",
    );
    expect(within(card).getByText("Praia no verão com o produto")).toBeInTheDocument();
    expect(within(card).getByText("ana.ugc")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Aprovar" })).toHaveClass("cursor-pointer");
    expect(within(card).getByRole("button", { name: "Rejeitar" })).toHaveClass("cursor-pointer");
    expect(within(card).getByRole("link", { name: "Ver detalhes" })).toHaveAttribute(
      "href",
      "/posts/post-1",
    );
    expect(within(card).getByRole("checkbox", { name: "Selecionar Praia no verão com o produto" })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith("/api/posts?page=1&limit=20&status=pending", {
      credentials: "same-origin",
    });
  });

  it("lists a campaign via GET /api/campaigns/:id/posts with status=pending", async () => {
    navigationMocks.searchParams = new URLSearchParams("page=2&campaignId=campaign-1");
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/campaigns/campaign-1/posts?")) {
        return jsonResponse(paginated([makePost()], { page: 2, total: 21, totalPages: 2 }));
      }
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderQueue();

    expect(await screen.findByText("ana.ugc")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/posts?page=2&limit=20&status=pending",
      { credentials: "same-origin" },
    );
  });

  it("filters the current page by postedAt period without sending from/to to the API", async () => {
    navigationMocks.searchParams = new URLSearchParams("from=2026-08-10&to=2026-08-10");
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(
          paginated([
            makePost(),
            makePost({
              id: "post-2",
              caption: "Post antigo",
              authorData: { username: "outra.ugc" },
              postedAt: "2026-07-01T12:00:00.000Z",
            }),
          ]),
        );
      }
      return jsonResponse([campaign]);
    });

    renderQueue();

    expect(await screen.findByText("ana.ugc")).toBeInTheDocument();
    expect(screen.queryByText("outra.ugc")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/posts?page=1&limit=20&status=pending", {
      credentials: "same-origin",
    });
  });

  it("writes the campaign and period filters to the URL and resets the page", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(paginated([makePost()], { page: 3, total: 50, totalPages: 3 }));
      }
      return jsonResponse([campaign]);
    });
    navigationMocks.searchParams = new URLSearchParams("page=3");

    renderQueue();
    await screen.findByText("ana.ugc");

    await user.selectOptions(screen.getByLabelText("Campanha"), "campaign-1");
    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/moderation?page=1&campaignId=campaign-1",
    );

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-08-01" } });
    expect(navigationMocks.replace).toHaveBeenCalledWith("/moderation?page=1&from=2026-08-01");

    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-08-31" } });
    expect(navigationMocks.replace).toHaveBeenCalledWith("/moderation?page=1&to=2026-08-31");
  });

  it("approves a pending post and removes it after refetch", async () => {
    const user = userEvent.setup();
    let postsCalls = 0;

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      if (url === "/api/posts/post-1/approve") {
        expect(init).toEqual(expect.objectContaining({ method: "POST" }));
        return jsonResponse({
          ...makePost({ status: "APPROVED" }),
          consent_link: "https://api.test/consent?token=abc",
        });
      }
      if (url.startsWith("/api/posts?")) {
        postsCalls += 1;
        return jsonResponse(paginated(postsCalls === 1 ? [makePost()] : []));
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderQueue();
    await user.click(await screen.findByRole("button", { name: "Aprovar" }));

    await waitFor(() => {
      expect(screen.getByText("Nenhum post pendente.")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/posts/post-1/approve",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });

  it("rejects a pending post with a reason and refetches the queue", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue("Fora do briefing");
    let postsCalls = 0;

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      if (url === "/api/posts/post-1/reject") {
        return jsonResponse(makePost({ status: "REJECTED" }));
      }
      if (url.startsWith("/api/posts?")) {
        postsCalls += 1;
        return jsonResponse(paginated(postsCalls === 1 ? [makePost()] : []));
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderQueue();
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
      expect(screen.getByText("Nenhum post pendente.")).toBeInTheDocument();
    });
  });

  it("approves selected posts in parallel", async () => {
    const user = userEvent.setup();
    let postsCalls = 0;
    const approveCalls: string[] = [];

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      if (url.endsWith("/approve")) {
        approveCalls.push(url);
        expect(init).toEqual(expect.objectContaining({ method: "POST" }));
        return jsonResponse({
          ...makePost({ id: url.split("/")[3], status: "APPROVED" }),
          consent_link: "https://api.test/consent?token=abc",
        });
      }
      if (url.startsWith("/api/posts?")) {
        postsCalls += 1;
        return jsonResponse(
          paginated(
            postsCalls === 1
              ? [
                  makePost(),
                  makePost({
                    id: "post-2",
                    caption: "Segundo post",
                    authorData: { username: "bia.ugc" },
                  }),
                ]
              : [],
          ),
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderQueue();
    await screen.findByText("ana.ugc");

    await user.click(screen.getByRole("checkbox", { name: "Selecionar todos" }));
    expect(screen.getByText("2 selecionados")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aprovar selecionados" }));

    await waitFor(() => {
      expect(screen.getByText("Nenhum post pendente.")).toBeInTheDocument();
    });
    expect(approveCalls.sort()).toEqual([
      "/api/posts/post-1/approve",
      "/api/posts/post-2/approve",
    ]);
  });

  it("rejects selected posts in parallel with a shared reason", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue("Fora do briefing");
    const rejectBodies: string[] = [];

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/campaigns") return jsonResponse([campaign]);
      if (url.endsWith("/reject")) {
        rejectBodies.push(String(init?.body));
        return jsonResponse(makePost({ id: url.split("/")[3], status: "REJECTED" }));
      }
      if (url.startsWith("/api/posts?")) {
        return jsonResponse(
          paginated([
            makePost(),
            makePost({
              id: "post-2",
              caption: "Segundo post",
              authorData: { username: "bia.ugc" },
            }),
          ]),
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderQueue();
    await screen.findByText("ana.ugc");

    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar Praia no verão com o produto" }),
    );
    await user.click(screen.getByRole("checkbox", { name: "Selecionar Segundo post" }));
    await user.click(screen.getByRole("button", { name: "Rejeitar selecionados" }));

    await waitFor(() => {
      expect(rejectBodies).toHaveLength(2);
    });
    expect(rejectBodies).toEqual([
      JSON.stringify({ rejection_reasons: "Fora do briefing" }),
      JSON.stringify({ rejection_reasons: "Fora do briefing" }),
    ]);
  });

  it("does not reject in batch when the reason prompt is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue(null);
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) return jsonResponse(paginated([makePost()]));
      return jsonResponse([campaign]);
    });

    renderQueue();
    await user.click(
      await screen.findByRole("checkbox", {
        name: "Selecionar Praia no verão com o produto",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Rejeitar selecionados" }));

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/posts/post-1/reject",
      expect.anything(),
    );
  });

  it("keeps batch actions disabled until a post is selected", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) return jsonResponse(paginated([makePost()]));
      return jsonResponse([campaign]);
    });

    renderQueue();
    await screen.findByText("ana.ugc");

    expect(screen.getByRole("button", { name: "Aprovar selecionados" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rejeitar selecionados" })).toBeDisabled();
    expect(screen.getByText("0 selecionados")).toBeInTheDocument();
  });

  it("shows a loading state while the queue is fetching", () => {
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    renderQueue();
    expect(screen.getByText("Carregando posts pendentes...")).toBeInTheDocument();
  });

  it("shows an error when the queue request fails", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/posts?")) {
        return jsonResponse({ message: "Falha ao carregar posts." }, { status: 500 });
      }
      return jsonResponse([campaign]);
    });

    renderQueue();

    expect(await screen.findByRole("alert", {}, { timeout: 3_000 })).toHaveTextContent(
      "Falha ao carregar posts.",
    );
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

    renderQueue();
    await screen.findByText("ana.ugc");
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(navigationMocks.replace).toHaveBeenCalledWith("/moderation?page=2");
  });
});
