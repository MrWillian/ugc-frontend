import type { ReactNode } from "react";
import { legalEntity } from "@/features/legal/config";

export function LegalDocument({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="space-y-8">
      <header className="space-y-3 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Última atualização: {legalEntity.lastUpdated}
        </p>
        <div className="text-muted-foreground">{intro}</div>
      </header>
      {children}
    </article>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-3 leading-relaxed [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:space-y-1"
    >
      <h2 className="text-xl font-semibold" id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MailLink({ email }: { email: string }) {
  return (
    <a className="font-medium text-primary hover:underline" href={`mailto:${email}`}>
      {email}
    </a>
  );
}
