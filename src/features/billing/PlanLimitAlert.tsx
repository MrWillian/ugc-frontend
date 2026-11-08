import Link from "next/link";
import type { JSX } from "react";

export function PlanLimitAlert({ message }: { message: string }): JSX.Element {
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}{" "}
      <Link className="font-medium underline" href="/billing">
        Ver planos e fazer upgrade
      </Link>
    </p>
  );
}
