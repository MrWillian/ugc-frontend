"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { mainNavItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="flex h-full flex-col">
      <ul className="flex flex-1 flex-col gap-1 p-3">
        {mainNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "border-l-4 border-primary bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
                href={href}
                title={collapsed ? label : undefined}
                onClick={onNavigate}
              >
                <Icon aria-hidden className="size-5 shrink-0" />
                <span className={cn(collapsed && "sr-only")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t p-3">
        <Link
          className={cn(
            "flex items-center gap-3 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "justify-center px-2" : "px-3",
          )}
          href="/logout"
          title={collapsed ? "Sair" : undefined}
          onClick={onNavigate}
        >
          <LogOut aria-hidden className="size-5 shrink-0" />
          <span className={cn(collapsed && "sr-only")}>Sair</span>
        </Link>
      </div>
    </nav>
  );
}
