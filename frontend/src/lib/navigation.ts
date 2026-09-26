import type { ComponentType, SVGProps } from "react";
import {
  IconArtefacts,
  IconDashboard,
  IconScans,
  IconSettings,
} from "@/components/icons/NavIcons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  match?: (pathname: string) => boolean;
};

export const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: IconDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/scans",
    label: "Scans",
    icon: IconScans,
    match: (p) => p.startsWith("/scans"),
  },
  {
    href: "/artefacts",
    label: "Artefacts",
    icon: IconArtefacts,
    match: (p) => p.startsWith("/artefacts"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: IconSettings,
    match: (p) => p.startsWith("/settings"),
  },
];
