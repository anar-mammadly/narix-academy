"use client";

import {
  LayoutDashboard, BookOpen, Trophy, MessageCircle,
  FileText, ClipboardList, Calendar, Award, User,
} from "lucide-react";
import { AppSidebar, type NavItem } from "@/components/layout/AppSidebar";

const NAV: NavItem[] = [
  { href: "/dashboard",             label: "Ana Səhifə",  icon: LayoutDashboard, exact: true },
  { href: "/dashboard/lessons",     label: "Dərslər",     icon: BookOpen },
  { href: "/dashboard/leaderboard", label: "Liderboard",  icon: Trophy },
  { href: "/dashboard/questions",   label: "Suallar",     icon: MessageCircle },
  { href: "/dashboard/notes",       label: "Qeydlər",     icon: FileText },
  { href: "/dashboard/homework",    label: "Tapşırıqlar", icon: ClipboardList },
  { href: "/dashboard/calendar",    label: "Təqvim",      icon: Calendar },
  { href: "/dashboard/certificate", label: "Sertifikat",  icon: Award },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard",             label: "Əsas",     icon: LayoutDashboard, exact: true },
  { href: "/dashboard/lessons",     label: "Dərslər",  icon: BookOpen },
  { href: "/dashboard/leaderboard", label: "Lider",    icon: Trophy },
  { href: "/dashboard/questions",   label: "Suallar",  icon: MessageCircle },
  { href: "/dashboard/profile",     label: "Profil",   icon: User },
];

export default function StudentSidebar({ session }: { session: any }) {
  return (
    <AppSidebar
      session={session}
      navItems={NAV}
      mobileNavItems={MOBILE_NAV}
      headerSubtitle="QA Platform"
      roleLabel="Tələbə"
      roleBadgeClassName="text-muted"
      profileHref="/dashboard/profile"
    />
  );
}
