"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, ClipboardList, MessageCircle, Calendar, ChevronRight, LogOut, Settings } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Əsas Səhifə", icon: LayoutDashboard, exact: true },
  { href: "/admin/modules", label: "Modullar & Dərslər", icon: BookOpen },
  { href: "/admin/students", label: "Tələbələr", icon: Users },
  { href: "/admin/homework", label: "Tapşırıqlar", icon: ClipboardList },
  { href: "/admin/questions", label: "Suallar", icon: MessageCircle },
  { href: "/admin/calendar", label: "Təqvim", icon: Calendar },
];

export default function AdminSidebar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-64 h-screen flex flex-col bg-white border-r border-gray-100 shrink-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base">N</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Narix Academy</div>
            <div className="text-xs text-blue-600 font-semibold">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link key={href} href={href} className={cn("sidebar-link", isActive(href, exact) && "active")}>
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
            {isActive(href, exact) && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <div className="sidebar-link">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(session.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{session.name}</div>
            <div className="text-xs text-blue-600 font-medium">Müəllim</div>
          </div>
        </div>
        <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={16} /> <span>Çıxış</span>
        </button>
      </div>
    </aside>
  );
}
