import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WidgetForm } from "@/features/widgets/WidgetForm";

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
    '<div id="ugc-widget-11111111-1111-4111-8111-111111111111"></div>',
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

describe("WidgetForm", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    navigationMocks.replace.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks create until the name is valid", async () => {
    const user = userEvent.setup();
    render(
      <QueryProvider>
        <WidgetForm mode="create" />
      </QueryProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Informe o nome.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts documented create fields and redirects to detail", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input) === "/api/widgets" && init?.method === "POST") {
        return Response.json(widget, { status: 201 });
      }
      throw new Error(`Unexpected URL: ${String(input)}`);
    });
    render(
      <QueryProvider>
        <WidgetForm mode="create" />
      </QueryProvider>,
    );

    await user.type(screen.getByLabelText("Nome"), "Galeria");
    await user.selectOptions(screen.getByLabelText("Layout"), "GRID");
    const filtersField = screen.getByLabelText(/Filters/);
    await user.click(filtersField);
    await user.paste('{"maxPosts": 10}');
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/widgets",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Galeria",
            layout: "GRID",
            filters: { maxPosts: 10 },
          }),
        }),
      );
    });
    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/widgets/11111111-1111-4111-8111-111111111111",
    );
  });

  it("shows a 403 plan-limit message", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { message: "Limite de widgets do plano atingido." },
        { status: 403 },
      ),
    );
    render(
      <QueryProvider>
        <WidgetForm mode="create" />
      </QueryProvider>,
    );

    await user.type(screen.getByLabelText("Nome"), "Galeria");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("Limite de widgets do plano atingido."),
    ).toBeInTheDocument();
    expect(navigationMocks.replace).not.toHaveBeenCalled();
  });

  it("hydrates edit and PATCHes documented fields", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/widgets/11111111-1111-4111-8111-111111111111") {
        if (init?.method === "PATCH") {
          return Response.json({ ...widget, name: "Vitrine" });
        }
        return Response.json(widget);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    render(
      <QueryProvider>
        <WidgetForm
          mode="edit"
          widgetId="11111111-1111-4111-8111-111111111111"
        />
      </QueryProvider>,
    );

    expect(await screen.findByDisplayValue("Galeria")).toBeInTheDocument();
    expect(await screen.findByDisplayValue(/maxPosts/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Vitrine");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/widgets/11111111-1111-4111-8111-111111111111",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            name: "Vitrine",
            layout: "GRID",
            filters: { maxPosts: 10 },
          }),
        }),
      );
    });
    expect(navigationMocks.replace).toHaveBeenCalledWith(
      "/widgets/11111111-1111-4111-8111-111111111111",
    );
  });
});
