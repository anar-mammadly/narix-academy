"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Users, ClipboardList,
  MessageCircle, Calendar, LogOut, GraduationCap, Menu, X, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

const NAV = [
  { href: "/admin",           label: "Əsas Səhifə",       icon: LayoutDashboard, exact: true },
  { href: "/admin/modules",   label: "Modullar & Dərslər", icon: BookOpen },
  { href: "/admin/students",  label: "Tələbələr",          icon: Users },
  { href: "/admin/homework",  label: "Tapşırıqlar",        icon: ClipboardList },
  { href: "/admin/questions", label: "Suallar",            icon: MessageCircle },
  { href: "/admin/calendar",  label: "Təqvim",             icon: Calendar },
];

export default function AdminSidebar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Narix Academy</div>
            <div className="text-xs text-blue-600 font-semibold">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={cn("sidebar-link", isActive(href, exact) && "active")}>
            <Icon size={18} strokeWidth={isActive(href, exact) ? 2.5 : 2} />
            <span>{label}</span>
            {isActive(href, exact) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-4 pt-2 border-t border-gray-100 space-y-1">
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
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 h-screen flex-col bg-white border-r border-gray-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between"
        style={{boxShadow:"0 1px 12px rgb(0 0 0 / 0.06)"}}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm">Narix Academy</span>
            <span className="ml-2 text-xs text-blue-600 font-semibold">Admin</span>
          </div>
        </div>
        <button onClick={() => setMobileOpen(true)} className="btn-ghost btn-sm p-2">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-50 fade-in" onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col slide-in-left">
            <div className="flex justify-end p-3 border-b border-gray-100">
              <button onClick={() => setMobileOpen(false)} className="btn-ghost btn-sm p-2"><X size={18}/></button>
            </div>
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
