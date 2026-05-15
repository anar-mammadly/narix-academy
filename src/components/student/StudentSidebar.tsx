"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Trophy, MessageCircle,
  FileText, ClipboardList, Calendar, Award, User, LogOut,
  GraduationCap, Menu, X
} from "lucide-react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",             label: "Ana Səhifə",  icon: LayoutDashboard, exact: true },
  { href: "/dashboard/lessons",     label: "Dərslər",     icon: BookOpen },
  { href: "/dashboard/leaderboard", label: "Liderboard",  icon: Trophy },
  { href: "/dashboard/questions",   label: "Suallar",     icon: MessageCircle },
  { href: "/dashboard/notes",       label: "Qeydlər",     icon: FileText },
  { href: "/dashboard/homework",    label: "Tapşırıqlar", icon: ClipboardList },
  { href: "/dashboard/calendar",    label: "Təqvim",      icon: Calendar },
  { href: "/dashboard/certificate", label: "Sertifikat",  icon: Award },
];

const MOBILE_NAV = [
  { href: "/dashboard",             label: "Əsas",     icon: LayoutDashboard, exact: true },
  { href: "/dashboard/lessons",     label: "Dərslər",  icon: BookOpen },
  { href: "/dashboard/leaderboard", label: "Lider",    icon: Trophy },
  { href: "/dashboard/questions",   label: "Suallar",  icon: MessageCircle },
  { href: "/dashboard/profile",     label: "Profil",   icon: User },
];

export default function StudentSidebar({ session }: { session: any }) {
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

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 h-screen flex-col bg-white border-r border-gray-100 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">Narix Academy</div>
              <div className="text-xs text-muted">QA Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href}
              className={cn("sidebar-link group", isActive(href, exact) && "active")}>
              <Icon size={18} strokeWidth={isActive(href, exact) ? 2.5 : 2} />
              <span>{label}</span>
              {isActive(href, exact) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-3 pb-4 pt-2 border-t border-gray-100 space-y-1">
          <Link href="/dashboard/profile"
            className={cn("sidebar-link", isActive("/dashboard/profile") && "active")}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getInitials(session.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{session.name}</div>
              <div className="text-xs text-muted">Tələbə</div>
            </div>
          </Link>
          <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={16} /> <span>Çıxış</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between"
        style={{ boxShadow: "0 1px 12px rgb(0 0 0 / 0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Narix Academy</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="btn-ghost btn-sm p-2">
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-50 fade-in" onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col slide-in-left">
            <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <GraduationCap size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Narix Academy</div>
                  <div className="text-xs text-muted">QA Platform</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="btn-ghost btn-sm p-2">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {NAV.map(({ href, label, icon: Icon, exact }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={cn("sidebar-link", isActive(href, exact) && "active")}>
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            <div className="px-3 pb-6 pt-2 border-t border-gray-100 space-y-1">
              <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)}
                className={cn("sidebar-link", isActive("/dashboard/profile") && "active")}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getInitials(session.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{session.name}</div>
                  <div className="text-xs text-muted">Tələbə</div>
                </div>
              </Link>
              <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50">
                <LogOut size={16} /> Çıxış
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden mobile-nav">
        {MOBILE_NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link key={href} href={href}
            className={cn("mobile-nav-item", isActive(href, exact) && "active")}>
            <Icon size={22} strokeWidth={isActive(href, exact) ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
