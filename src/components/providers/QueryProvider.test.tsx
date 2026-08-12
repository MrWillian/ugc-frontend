import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function Probe() {
  const client = useQueryClient();
  return <span>has-client:{String(Boolean(client))}</span>;
}

function CombinedProbe() {
  const client = useQueryClient();
  const auth = useAuth();

  return (
    <span>
      providers-ready:{String(Boolean(client) && auth.isLoading)}
    </span>
  );
}

describe("QueryProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes a QueryClient to descendants", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    expect(screen.getByText("has-client:true")).toBeInTheDocument();
  });

  it("can mount together with AuthProvider", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise<Response>(() => undefined),
    );

    render(
      <QueryProvider>
        <AuthProvider>
          <CombinedProbe />
        </AuthProvider>
      </QueryProvider>,
    );

    expect(screen.getByText("providers-ready:true")).toBeInTheDocument();
  });
});
