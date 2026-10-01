"use client";

import Link from "next/link";
import { Bell, ChevronDown, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SocialProofLogo } from "@/components/brand/SocialProofLogo";
import { mainNavItems } from "@/lib/nav-items";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPendingPostsMeta } from "@/features/dashboard/api";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function TopBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pendingQuery = useQuery({
    queryKey: ["posts", { status: "pending" }],
    queryFn: fetchPendingPostsMeta,
  });
  const pendingCount = pendingQuery.data?.meta?.total ?? 0;

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-brand-header px-4 text-white lg:px-6">
      <SocialProofLogo className="lg:hidden" href="/dashboard" variant="light" />
      <nav
        aria-label="Atalhos"
        className="hidden flex-1 items-center justify-center gap-1 md:flex"
      >
        {mainNavItems.map(({ href, label }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-white/15" : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
              href={href}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50"
          />
          <input
            aria-label="Pesquisar"
            className="h-9 w-48 rounded-lg border border-white/20 bg-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/50 lg:w-56"
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
          className="relative rounded-lg p-2 hover:bg-white/10"
          href="/moderation"
        >
          <Bell aria-hidden className="size-5" />
          {pendingCount > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          ) : null}
        </Link>
        {user ? (
          <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-white/10">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            >
              {userInitials(user.name)}
            </span>
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
            <ChevronDown aria-hidden className="hidden size-4 opacity-70 sm:block" />
          </div>
        ) : null}
      </div>
    </header>
  );
}
