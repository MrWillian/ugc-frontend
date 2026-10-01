import type { ModerationStatus } from "@/types";
import { cn } from "@/lib/utils";

function label(status: ModerationStatus): string {
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Rejeitado";
  return "Pendente";
}

export function StatusBadge({
  status,
  className,
}: {
  status: ModerationStatus;
  className?: string;
}) {
  const variant =
    status === "APPROVED"
      ? "bg-status-success-bg text-status-success"
      : status === "REJECTED"
        ? "bg-destructive/10 text-destructive"
        : "bg-status-warning-bg text-status-warning";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant,
        className,
      )}
    >
      {label(status)}
    </span>
  );
}
