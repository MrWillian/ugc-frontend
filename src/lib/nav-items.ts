import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Megaphone,
  ShieldCheck,
  LayoutGrid,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/moderation", label: "Moderação", icon: ShieldCheck },
  { href: "/widgets", label: "Widgets", icon: LayoutGrid },
  { href: "/settings", label: "Configurações", icon: Settings },
];
