import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InstagramCallbackPage from "./page";

vi.mock("@/features/instagram/InstagramCallback", () => ({
  InstagramCallback() {
    throw new Promise(() => {});
  },
}));

describe("InstagramCallbackPage", () => {
  it("shows a fallback while the callback component suspends", () => {
    render(<InstagramCallbackPage />);

    expect(screen.getByText("Carregando retorno do Instagram...")).toBeInTheDocument();
  });
});
