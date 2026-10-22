"use client";

import Link from "next/link";
import {
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { SocialProofLogo } from "@/components/brand/SocialProofLogo";
import { Button } from "@/components/ui/button";
import { fetchPendingPostsMeta } from "@/features/dashboard/api";

export function TopBar({
  onOpenMenu,
  onToggleSidebar,
  profile,
  sidebarCollapsed = false,
}: {
  onOpenMenu?: () => void;
  onToggleSidebar?: () => void;
  /** Server-rendered slot: the signed-in user's chip, streamed in behind a skeleton. */
  profile?: ReactNode;
  sidebarCollapsed?: boolean;
}) {
  const pendingQuery = useQuery({
    queryKey: ["posts", { status: "pending" }],
    queryFn: fetchPendingPostsMeta,
  });
  const pendingCount = pendingQuery.data?.meta?.total ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      {onOpenMenu ? (
        <Button
          aria-label="Abrir menu"
          className="lg:hidden"
          size="icon"
          type="button"
          variant="ghost"
          onClick={onOpenMenu}
        >
          <Menu className="size-5" />
        </Button>
      ) : null}
      {onToggleSidebar ? (
        <Button
          aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          aria-pressed={sidebarCollapsed}
          className="hidden lg:inline-flex"
          size="icon"
          title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          type="button"
          variant="ghost"
          onClick={onToggleSidebar}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </Button>
      ) : null}
      <SocialProofLogo className="lg:hidden" href="/dashboard" variant="dark" />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link
          aria-label={
            pendingCount > 0
              ? `${pendingCount} pendentes de moderação`
              : "Moderação"
          }
          className="relative rounded-lg p-2 transition-colors hover:bg-accent"
          href="/moderation"
        >
          <Bell aria-hidden className="size-5" />
          {pendingCount > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          ) : null}
        </Link>
        {profile}
      </div>
    </header>
  );
}
