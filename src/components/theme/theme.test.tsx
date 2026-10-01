import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function ThemeToggleProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Light
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("applies dark class when theme is set to dark", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggleProbe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Dark" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("socialproof-theme")).toBe("dark");
  });

  it("removes dark class when theme is set to light", async () => {
    const user = userEvent.setup();
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggleProbe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Light" }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
