"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, LogOut, Menu, X, GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Panelim", icon: LayoutDashboard },
  { href: "/dashboard#dersler", label: "Dərslərim", icon: BookOpen },
];

export function StudentShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">QA Academy</p>
            <p className="text-xs text-slate-500">{userName}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href.split("#")[0] === pathname;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
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
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-60 border-r border-slate-200 bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="font-semibold">Menyu</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="p-3">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-slate-800">Panelim</span>
        </header>
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
