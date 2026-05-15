"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Trophy, MessageCircle,
  FileText, ClipboardList, Calendar, Award, User, LogOut, ChevronRight
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Ana Səhifə", labelEn: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/lessons", label: "Dərslər", labelEn: "Lessons", icon: BookOpen },
  { href: "/dashboard/leaderboard", label: "Liderboard", labelEn: "Leaderboard", icon: Trophy },
  { href: "/dashboard/questions", label: "Suallar", labelEn: "Questions", icon: MessageCircle },
  { href: "/dashboard/notes", label: "Qeydlər", labelEn: "Notes", icon: FileText },
  { href: "/dashboard/homework", label: "Tapşırıqlar", labelEn: "Homework", icon: ClipboardList },
  { href: "/dashboard/calendar", label: "Təqvim", labelEn: "Calendar", icon: Calendar },
  { href: "/dashboard/certificate", label: "Sertifikat", labelEn: "Certificate", icon: Award },
];

export default function StudentSidebar({ session }: { session: SessionPayload }) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = session.language as "az" | "en";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-64 h-screen flex flex-col bg-white border-r border-gray-100 shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base">N</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">Narix Academy</div>
            <div className="text-xs text-muted">QA Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, labelEn, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn("sidebar-link", isActive(href, exact) && "active")}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{lang === "en" ? labelEn : label}</span>
            {isActive(href, exact) && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </Link>
        ))}
      </nav>

      {/* Profile */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link href="/dashboard/profile" className={cn("sidebar-link", isActive("/dashboard/profile") && "active")}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(session.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{session.name}</div>
            <div className="text-xs text-muted">Tələbə</div>
          </div>
        </Link>
        <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={16} />
          <span>{lang === "en" ? "Logout" : "Çıxış"}</span>
        </button>
      </div>
    </aside>
  );
}
