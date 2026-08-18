import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignForm } from "@/features/campaigns/CampaignForm";
import { CampaignsList } from "@/features/campaigns/CampaignsList";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
}));

const campaign = {
  id: "campaign-1",
  clientId: "client-1",
  name: "Campanha verão",
  hashtag: "Verao_2026",
  termsText: "Termos da campanha",
  active: true,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

describe("CampaignsList", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders campaigns in a table with edit, deactivate, and posts actions", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([campaign]));

    render(<CampaignsList />);

    expect(await screen.findByRole("link", { name: "Nova Campanha" })).toHaveAttribute(
      "href",
      "/campaigns/new",
    );
    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Hashtag" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Ativo" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Criado em" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Ações" })).toBeInTheDocument();

    const row = screen.getByRole("row", { name: /Campanha verão/ });
    expect(within(row).getByText("Campanha verão")).toBeInTheDocument();
    expect(within(row).getByText("Verao_2026")).toBeInTheDocument();
    expect(within(row).getByText("Ativo")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/campaigns/campaign-1/edit",
    );
    expect(within(row).getByRole("button", { name: "Desativar" })).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Ver Posts" })).toHaveAttribute(
      "href",
      "/posts?campaignId=campaign-1",
    );
  });

  it("toggles a campaign inactive via PATCH and updates the badge", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(Response.json([campaign]))
      .mockResolvedValueOnce(Response.json({ ...campaign, active: false }));

    render(<CampaignsList />);

    await user.click(await screen.findByRole("button", { name: "Desativar" }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/campaigns/campaign-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ active: false }),
      }),
    );
    expect(await screen.findByText("Inativo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativar" })).toBeInTheDocument();
  });
});

describe("CampaignForm", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    navigationMocks.replace.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("links back to the campaigns list from create", () => {
    render(<CampaignForm mode="create" />);

    expect(screen.getByRole("heading", { name: "Nova Campanha" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar às campanhas" })).toHaveAttribute(
      "href",
      "/campaigns",
    );
  });

  it("links back to the campaigns list from edit", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(campaign));
    render(<CampaignForm mode="edit" campaignId="campaign-1" />);

    expect(screen.getByRole("heading", { name: "Editar Campanha" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar às campanhas" })).toHaveAttribute(
      "href",
      "/campaigns",
    );
    expect(await screen.findByDisplayValue("Campanha verão")).toBeInTheDocument();
  });

  it("blocks create submission until name and hashtag are valid", async () => {
    const user = userEvent.setup();
    render(<CampaignForm mode="create" />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("O nome deve ter ao menos 3 caracteres."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts documented create fields and redirects to the list", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(Response.json(campaign, { status: 201 }));
    render(<CampaignForm mode="create" />);

    await user.type(screen.getByLabelText("Nome"), "Campanha verão");
    await user.type(screen.getByLabelText("Hashtag"), "Verao_2026");
    await user.type(screen.getByLabelText("Termos (opcional)"), "Termos da campanha");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/campaigns",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Campanha verão",
            hashtag: "Verao_2026",
            terms_text: "Termos da campanha",
          }),
        }),
      );
      expect(navigationMocks.replace).toHaveBeenCalledWith("/campaigns");
    });
  });

  it("loads a campaign and patches documented edit fields", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(Response.json(campaign))
      .mockResolvedValueOnce(Response.json({ ...campaign, name: "Campanha inverno" }));

    render(<CampaignForm mode="edit" campaignId="campaign-1" />);

    expect(await screen.findByDisplayValue("Campanha verão")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Verao_2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Termos da campanha")).toBeInTheDocument();
    expect(screen.getByLabelText("Ativa")).toBeChecked();

    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Campanha inverno");
    await user.click(screen.getByLabelText("Ativa"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/campaigns/campaign-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            name: "Campanha inverno",
            hashtag: "Verao_2026",
            terms_text: "Termos da campanha",
            active: false,
          }),
        }),
      );
      expect(navigationMocks.replace).toHaveBeenCalledWith("/campaigns");
    });
  });

  it("shows a backend 403 message on create", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { message: "Limite de campanhas ativas do plano atingido." },
        { status: 403 },
      ),
    );
    render(<CampaignForm mode="create" />);

    await user.type(screen.getByLabelText("Nome"), "Campanha verão");
    await user.type(screen.getByLabelText("Hashtag"), "Verao_2026");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Limite de campanhas ativas do plano atingido.",
    );
    expect(navigationMocks.replace).not.toHaveBeenCalled();
  });
});
