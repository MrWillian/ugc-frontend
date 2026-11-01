import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DataDeletionPage from "@/app/(legal)/exclusao-de-dados/page";
import LegalLayout from "@/app/(legal)/layout";
import PrivacyPage from "@/app/(legal)/privacidade/page";
import TermsPage from "@/app/(legal)/termos/page";
import { legalEntity } from "@/features/legal/config";

describe("legal pages", () => {
  it.each([
    ["Termos de Uso", TermsPage],
    ["Política de Privacidade", PrivacyPage],
    ["Instruções para exclusão de dados", DataDeletionPage],
  ])("renders %s with the last update date", (title, Page) => {
    render(<Page />);

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(
      screen.getByText(`Última atualização: ${legalEntity.lastUpdated}`),
    ).toBeInTheDocument();
  });

  it("lists the LGPD data subject rights and the DPO contact", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "7. Seus direitos como titular" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "10. Encarregado pelo tratamento de dados (DPO)" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: legalEntity.dpoEmail })[0],
    ).toHaveAttribute("href", `mailto:${legalEntity.dpoEmail}`);
  });

  it("links every legal document from the layout navigation", () => {
    render(
      <LegalLayout>
        <p>conteúdo</p>
      </LegalLayout>,
    );
    const nav = screen.getByRole("navigation", { name: "Documentos legais" });

    expect(nav.querySelectorAll("a")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute("href", "/termos");
    expect(screen.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
      "href",
      "/privacidade",
    );
    expect(screen.getByRole("link", { name: "Exclusão de dados" })).toHaveAttribute(
      "href",
      "/exclusao-de-dados",
    );
  });
});
