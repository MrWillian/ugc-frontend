import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";

function Probe() {
  const client = useQueryClient();
  return <span>has-client:{String(Boolean(client))}</span>;
}

describe("QueryProvider", () => {
  it("exposes a QueryClient to descendants", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    expect(screen.getByText("has-client:true")).toBeInTheDocument();
  });
});
