"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SocialProofLogo } from "@/components/brand/SocialProofLogo";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-card lg:block">
          <div className="border-b px-4 py-4">
            <SocialProofLogo href="/dashboard" variant="dark" />
          </div>
          <SidebarNav />
        </aside>
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/40"
              type="button"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-card shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-4">
                <SocialProofLogo href="/dashboard" variant="dark" />
                <Button
                  aria-label="Fechar"
                  size="icon"
                  type="button"
                  variant="ghost"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b bg-card px-4 py-2 lg:hidden">
            <Button
              aria-label="Abrir menu"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
