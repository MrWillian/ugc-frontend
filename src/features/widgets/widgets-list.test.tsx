import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WidgetsList } from "@/features/widgets/WidgetsList";

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

function renderList() {
  return render(
    <QueryProvider>
      <WidgetsList />
    </QueryProvider>,
  );
}

describe("WidgetsList", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders widgets with name, layout, embed, and new-widget link", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input) === "/api/widgets") {
        return Response.json([widget]);
      }
      throw new Error(`Unexpected URL: ${String(input)}`);
    });
    renderList();

    expect(await screen.findByRole("link", { name: "Novo Widget" })).toHaveAttribute(
      "href",
      "/widgets/new",
    );
    expect(
      await screen.findByRole("columnheader", { name: "Nome" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Layout" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Código de Embed" }),
    ).toBeInTheDocument();

    const row = screen.getByRole("row", { name: /Galeria/ });
    expect(within(row).getByRole("link", { name: "Galeria" })).toHaveAttribute(
      "href",
      "/widgets/11111111-1111-4111-8111-111111111111",
    );
    expect(within(row).getByText("Grid")).toBeInTheDocument();
    expect(within(row).getByDisplayValue(/ugc-widget-11111111/)).toBeInTheDocument();
  });

  it("copies embed code from the row", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input) => {
      if (String(input) === "/api/widgets") {
        return Response.json([widget]);
      }
      throw new Error(`Unexpected URL: ${String(input)}`);
    });
    renderList();

    await user.click(await screen.findByRole("button", { name: "Copiar" }));
    expect(await screen.findByRole("button", { name: "Copiado" })).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input) === "/api/widgets") {
        return Response.json([]);
      }
      throw new Error(`Unexpected URL: ${String(input)}`);
    });
    renderList();
    expect(
      await screen.findByText("Nenhum widget cadastrado."),
    ).toBeInTheDocument();
  });
});
