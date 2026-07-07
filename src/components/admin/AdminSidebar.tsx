"use client";

import { LayoutDashboard, BookOpen, Users, ClipboardList, MessageCircle, Calendar } from "lucide-react";
import { AppSidebar, type NavItem } from "@/components/layout/AppSidebar";

const NAV: NavItem[] = [
  { href: "/admin",           label: "Əsas Səhifə",        icon: LayoutDashboard, exact: true },
  { href: "/admin/modules",   label: "Modullar & Dərslər", icon: BookOpen },
  { href: "/admin/students",  label: "Tələbələr",          icon: Users },
  { href: "/admin/homework",  label: "Tapşırıqlar",        icon: ClipboardList },
  { href: "/admin/questions", label: "Suallar",            icon: MessageCircle },
  { href: "/admin/calendar",  label: "Təqvim",             icon: Calendar },
];

export default function AdminSidebar({ session }: { session: any }) {
  return (
    <AppSidebar
      session={session}
      navItems={NAV}
      headerSubtitle="Admin Panel"
      roleLabel="Müəllim"
      roleBadgeClassName="text-blue-600"
    />
  );
}
