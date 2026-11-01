import { SocialProofLogo } from "@/components/brand/SocialProofLogo";
import { legalEntity } from "@/features/legal/config";
import { LegalLinks } from "@/features/legal/components/LegalLinks";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <SocialProofLogo href="/login" variant="dark" />
          <LegalLinks className="text-sm" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>
      <footer className="border-t">
        <div className="mx-auto max-w-3xl space-y-1 px-6 py-6 text-center text-xs text-muted-foreground">
          <p>
            {legalEntity.brand} · {legalEntity.companyName} · CNPJ {legalEntity.cnpj}
          </p>
          <p>{legalEntity.address}</p>
        </div>
      </footer>
    </div>
  );
}
