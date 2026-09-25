import {
  CalendarDays,
  ChartColumn,
  FolderKanban,
  House,
  Settings,
  SquareCheckBig,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/clients", label: "Clients", icon: UsersRound },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: SquareCheckBig },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/team", label: "Team", icon: Users },
  { href: "/reports", label: "Reports", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
