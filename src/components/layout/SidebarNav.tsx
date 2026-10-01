"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { mainNavItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="flex h-full flex-col">
      <ul className="flex flex-1 flex-col gap-1 p-3">
        {mainNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-l-4 border-primary bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
                href={href}
                onClick={onNavigate}
              >
                <Icon aria-hidden className="size-5 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t p-3">
        <Link
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          href="/settings#perfil"
          onClick={onNavigate}
        >
          <User aria-hidden className="size-5" />
          Perfil
        </Link>
      </div>
    </nav>
  );
}
