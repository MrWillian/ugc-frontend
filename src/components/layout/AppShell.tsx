"use client";

import { X } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { SocialProofLogo } from "@/components/brand/SocialProofLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
    () => false,
  );

  function toggle() {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "0" : "1");
    // The native storage event only fires in other tabs.
    window.dispatchEvent(new StorageEvent("storage", { key: SIDEBAR_COLLAPSED_KEY }));
  }

  return [collapsed, toggle] as const;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <SocialProofLogo href="/dashboard" iconOnly={collapsed} variant="dark" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav collapsed={collapsed} />
        </div>
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
            <div className="flex h-16 items-center justify-between border-b px-4">
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
        <TopBar
          sidebarCollapsed={collapsed}
          onOpenMenu={() => setMobileOpen(true)}
          onToggleSidebar={toggleCollapsed}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
