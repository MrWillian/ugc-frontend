import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SocialProofLogo({
  className,
  href = "/dashboard",
  variant = "light",
  iconOnly = false,
}: {
  className?: string;
  href?: string;
  variant?: "light" | "dark";
  iconOnly?: boolean;
}) {
  const textClass =
    variant === "light" ? "text-white" : "text-foreground";

  return (
    <Link
      aria-label={iconOnly ? "SocialProof" : undefined}
      className={cn("inline-flex items-center gap-2 font-semibold", textClass, className)}
      href={href}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
        <MessageCircle aria-hidden className="size-5 text-primary" />
      </span>
      {iconOnly ? null : <span>SocialProof</span>}
    </Link>
  );
}
