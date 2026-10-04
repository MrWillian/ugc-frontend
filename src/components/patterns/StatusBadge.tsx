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
      ? "border border-status-success/25 bg-status-success-bg text-status-success"
      : status === "REJECTED"
        ? "border border-destructive/30 bg-destructive/15 text-destructive dark:text-red-300"
        : "border border-status-warning/25 bg-status-warning-bg text-status-warning";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center self-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium leading-none",
        variant,
        className,
      )}
    >
      {label(status)}
    </span>
  );
}
