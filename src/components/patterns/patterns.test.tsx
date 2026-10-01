import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("maps APPROVED to Aprovado", () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  it("maps PENDING to Pendente", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("maps REJECTED to Rejeitado", () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText("Rejeitado")).toBeInTheDocument();
  });
});
