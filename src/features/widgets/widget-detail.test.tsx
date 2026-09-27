import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WidgetDetail } from "@/features/widgets/WidgetDetail";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
}));

const widget = {
  id: "11111111-1111-4111-8111-111111111111",
  clientId: "client-1",
  name: "Galeria",
  layout: "GRID" as const,
  filters: { maxPosts: 10 },
  embedCode:
    '<div id="ugc-widget-11111111-1111-4111-8111-111111111111"></div>\n<script src="http://localhost:3000/api/widget/11111111-1111-4111-8111-111111111111.js" defer></script>',
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

const publicPost = {
  id: "post-1",
  content_url: "https://cdn.example/photo.jpg",
  thumbnail_url: null,
  caption: "Verão",
  author_data: { username: "ana" },
  posted_at: "2026-05-30T12:00:00.000Z",
};

function renderDetail() {
  return render(
    <QueryProvider>
      <WidgetDetail widgetId="11111111-1111-4111-8111-111111111111" />
    </QueryProvider>,
  );
}

describe("WidgetDetail", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    navigationMocks.replace.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders details, embed, preview, and edit link", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/widgets/11111111-1111-4111-8111-111111111111") {
        return Response.json(widget);
      }
      if (url === "/api/widget/11111111-1111-4111-8111-111111111111/posts") {
        return Response.json([publicPost]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    renderDetail();

    expect(await screen.findByRole("heading", { name: "Galeria" })).toBeInTheDocument();
    expect(screen.getByText("Grid")).toBeInTheDocument();
    expect(screen.getByText(/maxPosts/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/ugc-widget-11111111/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/widgets/11111111-1111-4111-8111-111111111111/edit",
    );
    expect(await screen.findByAltText("Verão")).toHaveAttribute(
      "src",
      "https://cdn.example/photo.jpg",
    );
    expect(screen.getByText("@ana")).toBeInTheDocument();
  });

  it("copies the embed code", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/widgets/")) return Response.json(widget);
      return Response.json([]);
    });

    renderDetail();
    await user.click(await screen.findByRole("button", { name: "Copiar" }));
    expect(await screen.findByRole("button", { name: "Copiado" })).toBeInTheDocument();
  });

  it("deletes after confirm and redirects to the list", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (
        init &&
        typeof init === "object" &&
        "method" in init &&
        init.method === "DELETE"
      ) {
        return new Response(null, { status: 204 });
      }
      if (url.startsWith("/api/widgets/")) return Response.json(widget);
      return Response.json([]);
    });

    renderDetail();
    await user.click(await screen.findByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/widgets/11111111-1111-4111-8111-111111111111",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(window.confirm).toHaveBeenCalled();
    expect(navigationMocks.replace).toHaveBeenCalledWith("/widgets");
  });

  it("shows the empty preview explanation", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input).startsWith("/api/widgets/")) return Response.json(widget);
      return Response.json([]);
    });

    renderDetail();
    expect(
      await screen.findByText(
        "Nenhum post visível neste widget. Só entram posts com consentimento concedido e display visível.",
      ),
    ).toBeInTheDocument();
  });
});
