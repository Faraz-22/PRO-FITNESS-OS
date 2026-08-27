"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  Target,
  FileText,
  Bell,
  Settings,
  Shield,
  Activity,
  ClipboardList,
  MapPin,
  Tag
} from "lucide-react";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/staff/dashboard" },
  { label: "Reception", icon: ClipboardList, href: "/staff/reception" },
  { label: "Members", icon: Users, href: "/staff/members" },
  { label: "CRM / Leads", icon: Target, href: "/staff/crm" },
  { label: "Memberships", icon: CreditCard, href: "/staff/memberships" },
  { label: "Finance", icon: FileText, href: "/staff/finance" },
  { label: "Coupons", icon: Tag, href: "/staff/coupons" },
  { label: "Attendance", icon: CalendarCheck, href: "/staff/attendance" },
  { label: "Training", icon: Dumbbell, href: "/staff/training" },
  { label: "Fitness", icon: Activity, href: "/staff/fitness" },
  { label: "Reports", icon: FileText, href: "/staff/reports" },
  { label: "Notifications", icon: Bell, href: "/staff/notifications" },
  { label: "Team", icon: Users, href: "/staff/team" },
  { label: "Settings", icon: Settings, href: "/staff/settings" },
  { label: "Audit", icon: Shield, href: "/staff/activity" },
];

interface SidebarProps {
  branchName?: string;
}

export const Sidebar = ({ branchName = "Main Branch" }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="px-3 py-2 flex-1">
        <div className="mb-10 pl-3">
          <Link href="/staff/dashboard" className="flex items-center">
            <div className="relative w-10 h-10 mr-3 flex items-center justify-center rounded-md overflow-hidden">
              <img src="/gym-logo.jpg" alt="Pro Fitness Logo" className="object-cover w-full h-full" />
            </div>
            <h1 className="text-xl font-bold tracking-widest text-primary">PRO FITNESS</h1>
          </Link>
          <div className="flex items-center mt-2 text-xs text-muted-foreground ml-11">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate pr-2">{branchName}</span>
          </div>
        </div>
        <div className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname.startsWith(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                  {route.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
