import Link from "next/link";
import { legalDocuments } from "@/features/legal/config";
import { cn } from "@/lib/utils";

export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Documentos legais"
      className={cn("flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}
    >
      {legalDocuments.map((document) => (
        <Link className="hover:text-foreground hover:underline" href={document.href} key={document.href}>
          {document.label}
        </Link>
      ))}
    </nav>
  );
}
