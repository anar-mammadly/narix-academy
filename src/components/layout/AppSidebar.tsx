"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, GraduationCap, Menu, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface AppSidebarProps {
  session: { name: string };
  navItems: NavItem[];
  mobileNavItems?: NavItem[];
  headerSubtitle?: string;
  roleLabel: string;
  roleBadgeClassName?: string;
  profileHref?: string;
}

export function AppSidebar({
  session,
  navItems,
  mobileNavItems,
  headerSubtitle,
  roleLabel,
  roleBadgeClassName = "text-muted",
  profileHref,
}: AppSidebarProps) {
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

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="border-b border-gray-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-sm">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-gray-900">Narix Academy</div>
            <div className={cn("text-xs font-semibold", roleBadgeClassName)}>{headerSubtitle ?? roleLabel}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn("sidebar-link group", isActive(href, exact) && "active")}
          >
            <Icon size={18} strokeWidth={isActive(href, exact) ? 2.5 : 2} />
            <span>{label}</span>
            {isActive(href, exact) && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t border-gray-100 px-3 pb-4 pt-2">
        {profileHref ? (
          <Link
            href={profileHref}
            onClick={onNavigate}
            className={cn("sidebar-link", isActive(profileHref) && "active")}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-bold text-white">
              {getInitials(session.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">{session.name}</div>
              <div className={cn("text-xs", roleBadgeClassName)}>{roleLabel}</div>
            </div>
          </Link>
        ) : (
          <div className="sidebar-link">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-bold text-white">
              {getInitials(session.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">{session.name}</div>
              <div className={cn("text-xs", roleBadgeClassName)}>{roleLabel}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} /> <span>Çıxış</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:hidden"
        style={{ boxShadow: "0 1px 12px rgb(0 0 0 / 0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">Narix Academy</span>
          <span className={cn("text-xs font-semibold", roleBadgeClassName)}>{roleLabel}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="btn-ghost btn-sm p-2">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 fade-in lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col bg-white slide-in-left lg:hidden">
            <div className="flex justify-end border-b border-gray-100 p-3">
              <button onClick={() => setMobileOpen(false)} className="btn-ghost btn-sm p-2">
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Mobile bottom nav */}
      {mobileNavItems && (
        <nav className="mobile-nav lg:hidden">
          {mobileNavItems.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={cn("mobile-nav-item", isActive(href, exact) && "active")}>
              <Icon size={22} strokeWidth={isActive(href, exact) ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
