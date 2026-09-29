import type { ComponentType, SVGProps } from "react";
import {
  IconArtefacts,
  IconDashboard,
  IconExecutive,
  IconScans,
  IconSettings,
  IconTrust,
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
    href: "/executive",
    label: "Executive",
    icon: IconExecutive,
    match: (p) => p.startsWith("/executive"),
  },
  {
    href: "/trust",
    label: "Trust",
    icon: IconTrust,
    match: (p) => p.startsWith("/trust"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: IconSettings,
    match: (p) => p.startsWith("/settings"),
  },
];
