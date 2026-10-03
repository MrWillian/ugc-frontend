"use client";

import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SocialProofLogo } from "@/components/brand/SocialProofLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPendingPostsMeta } from "@/features/dashboard/api";
import { cn } from "@/lib/utils";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

const profileMenuItems = [
  { href: "/settings#perfil", label: "Perfil", icon: User },
  { href: "/settings", label: "Configurações", icon: Settings },
];

function ProfileMenu({ name, email }: { name: string; email?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      );
      if (items.length === 0) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      items[(current + delta + items.length) % items.length]!.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu do perfil"
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-accent"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {userInitials(name)}
        </span>
        <span className="hidden text-sm font-medium sm:inline">{name}</span>
        <ChevronDown
          aria-hidden
          className={cn("hidden size-4 opacity-70 transition-transform sm:block", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          ref={menuRef}
          aria-label="Perfil"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{name}</p>
            {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
          </div>
          <div className="my-1 h-px bg-border" role="separator" />
          {profileMenuItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent focus-visible:bg-accent"
              href={href}
              role="menuitem"
              onClick={close}
            >
              <Icon aria-hidden className="size-4 text-muted-foreground" />
              {label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" role="separator" />
          <Link
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
            href="/logout"
            role="menuitem"
            onClick={close}
          >
            <LogOut aria-hidden className="size-4" />
            Sair
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function TopBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { user } = useAuth();
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
      <SocialProofLogo className="lg:hidden" href="/dashboard" variant="dark" />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            aria-label="Pesquisar"
            className="h-9 w-48 rounded-lg border bg-muted/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground lg:w-64"
            disabled
            placeholder="Em breve"
            title="Em breve"
          />
        </div>
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
        {user ? <ProfileMenu email={user.email} name={user.name} /> : null}
      </div>
    </header>
  );
}
