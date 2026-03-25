"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  FileJson,
  EyeOff,
  Users,
  Inbox,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/frontend/lib/cn";

const links = [
  { href: "/admin", label: "İdarə paneli", icon: LayoutDashboard },
  { href: "/admin/modules", label: "Modullar", icon: FolderOpen },
  { href: "/admin/lessons", label: "Dərslər", icon: BookOpen },
  { href: "/admin/import", label: "Import from JSON", icon: FileJson },
  {
    href: "/admin/student-content-visibility",
    label: "Student görünüş qaydaları",
    icon: EyeOff,
  },
  { href: "/admin/students", label: "Tələbələr", icon: Users },
  { href: "/admin/submissions", label: "Təqdimatlar", icon: Inbox },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-sidebar text-slate-100">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold">QA Academy</p>
          <p className="text-xs text-slate-400">Müəllim paneli</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-4 w-4" />
          Çıxış
        </button>
      </div>
    </aside>
  );
}
