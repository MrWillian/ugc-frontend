import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  icon?: ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className="text-muted-foreground [&>svg]:size-5">{icon}</span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {subtext != null && subtext !== "" ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>
      ) : null}
    </>
  );

  const cardClass = cn(
    "rounded-xl border bg-card p-5 shadow-sm transition-colors",
    href && "hover:bg-accent/30",
    className,
  );

  if (href) {
    return (
      <Link className={cardClass} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
