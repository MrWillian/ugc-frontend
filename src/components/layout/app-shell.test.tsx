import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppShell } from "./AppShell";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/posts",
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Ana Souza", email: "ana@acme.test" },
  }),
}));

vi.mock("@/features/dashboard/api", () => ({
  fetchPendingPostsMeta: vi.fn().mockResolvedValue({ meta: { total: 0 } }),
}));

describe("SidebarNav", () => {
  it("marks Posts link as active on /posts", () => {
    render(<SidebarNav />);
    const postsLink = screen.getByRole("link", { name: /Posts/i });
    expect(postsLink.className).toMatch(/border-primary/);
  });

  it("shows a Sair link in the footer instead of Perfil", () => {
    render(<SidebarNav />);
    expect(screen.getByRole("link", { name: "Sair" })).toHaveAttribute("href", "/logout");
    expect(screen.queryByRole("link", { name: "Perfil" })).not.toBeInTheDocument();
  });

  it("keeps accessible names but hides labels visually when collapsed", () => {
    render(<SidebarNav collapsed />);
    const postsLink = screen.getByRole("link", { name: "Posts" });
    expect(postsLink).toHaveAttribute("title", "Posts");
    expect(screen.getByText("Posts")).toHaveClass("sr-only");
  });
});

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("collapses the sidebar and remembers the choice", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AppShell>conteúdo</AppShell>, { wrapper: QueryProvider });

    await user.click(screen.getByRole("button", { name: "Recolher menu lateral" }));
    expect(screen.getByRole("button", { name: "Expandir menu lateral" })).toBeInTheDocument();
    expect(window.localStorage.getItem("sidebar-collapsed")).toBe("1");

    unmount();
    render(<AppShell>conteúdo</AppShell>, { wrapper: QueryProvider });
    expect(screen.getByRole("button", { name: "Expandir menu lateral" })).toBeInTheDocument();
  });
});

describe("TopBar", () => {
  it("does not render the horizontal shortcut nav", () => {
    render(<TopBar />, { wrapper: QueryProvider });
    expect(screen.queryByRole("navigation", { name: "Atalhos" })).not.toBeInTheDocument();
  });

  it("opens the profile menu with profile and settings items", async () => {
    const user = userEvent.setup();
    render(<TopBar />, { wrapper: QueryProvider });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Menu do perfil" }));

    expect(screen.getByRole("menuitem", { name: "Perfil" })).toHaveAttribute(
      "href",
      "/settings#perfil",
    );
    expect(screen.getByRole("menuitem", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/settings",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
