import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardInstagramCard } from "@/features/dashboard/DashboardInstagramCard";

const navigationMocks = vi.hoisted(() => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => navigationMocks);

vi.mock("@/features/instagram/InstagramConnectionCard", () => ({
  InstagramConnectionCard: ({ justConnected }: { justConnected?: boolean }) => (
    <p>{justConnected ? "just connected" : "idle"}</p>
  ),
}));

describe("DashboardInstagramCard", () => {
  const replaceMock = vi.fn();

  beforeEach(() => {
    replaceMock.mockReset();
    navigationMocks.useRouter.mockReturnValue({ replace: replaceMock });
  });

  it("renders the Instagram connection under its own heading", () => {
    navigationMocks.useSearchParams.mockReturnValue(new URLSearchParams());

    render(<DashboardInstagramCard />);

    expect(screen.getByRole("heading", { name: "Instagram" })).toBeInTheDocument();
    expect(screen.getByText("idle")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("confirms the OAuth return and clears it from the URL", () => {
    navigationMocks.useSearchParams.mockReturnValue(
      new URLSearchParams("instagram=connected"),
    );

    render(<DashboardInstagramCard />);

    expect(screen.getByText("just connected")).toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith("/dashboard", { scroll: false });
  });
});
