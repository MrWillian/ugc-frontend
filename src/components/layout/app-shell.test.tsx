import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarNav } from "./SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/posts",
}));

describe("SidebarNav", () => {
  it("marks Posts link as active on /posts", () => {
    render(<SidebarNav />);
    const postsLink = screen.getByRole("link", { name: /Posts/i });
    expect(postsLink.className).toMatch(/border-primary/);
  });
});
