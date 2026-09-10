import type { LucideIcon } from "lucide-react";
import { Box, LayoutDashboard, ScanLine, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

export const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/scans",
    label: "Scans",
    icon: ScanLine,
    match: (p) => p.startsWith("/scans"),
  },
  {
    href: "/artefacts",
    label: "Artefacts",
    icon: Box,
    match: (p) => p.startsWith("/artefacts"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/settings"),
  },
];
