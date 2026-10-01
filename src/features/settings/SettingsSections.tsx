"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type Theme } from "@/components/theme/ThemeProvider";
import { InstagramConnectionCard } from "@/features/instagram/InstagramConnectionCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function SettingsCard({
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
      className="scroll-mt-6 rounded-xl border bg-card p-6 shadow-sm"
      id={id}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SettingsSections() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return <p className="text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsCard id="perfil" title="Perfil">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Nome</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/logout">Sair</Link>
        </Button>
      </SettingsCard>

      <SettingsCard id="plano" title="Plano">
        <p className="text-sm">
          Plano atual: <span className="font-semibold">{user.plan}</span>
        </p>
        <Button className="mt-4" disabled type="button">
          Upgrade — em breve
        </Button>
      </SettingsCard>

      <SettingsCard id="instagram" title="Instagram">
        <InstagramConnectionCard />
      </SettingsCard>

      <SettingsCard id="preferencias" title="Preferências">
        <div className="space-y-2">
          <Label htmlFor="theme-select">Tema</Label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
            <option value="system">Sistema</option>
          </select>
        </div>
      </SettingsCard>

      <SettingsCard id="conta" title="Conta">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Subdomínio</dt>
            <dd className="font-medium">{user.subdomain}</dd>
          </div>
          {user.companyName ? (
            <div>
              <dt className="text-muted-foreground">Empresa</dt>
              <dd className="font-medium">{user.companyName}</dd>
            </div>
          ) : null}
        </dl>
      </SettingsCard>
    </div>
  );
}
