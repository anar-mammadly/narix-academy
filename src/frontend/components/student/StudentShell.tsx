"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/frontend/lib/cn";
import { Button } from "@/frontend/components/ui/button";

const links = [
  { href: "/dashboard", label: "Panelim", icon: LayoutDashboard },
  { href: "/dashboard#dersler", label: "Dərslərim", icon: BookOpen },
  { href: "/dashboard/playground", label: "Playground", icon: Sparkles },
];

function headerTitle(pathname: string): string {
  if (pathname === "/dashboard/playground") return "Playground";
  if (pathname.startsWith("/dashboard/lessons")) return "Dərs";
  return "Panelim";
}

export function StudentShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const title = useMemo(() => headerTitle(pathname), [pathname]);

  useEffect(() => {
    setHash(typeof window !== "undefined" ? window.location.hash : "");
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-100/90 via-slate-50 to-white">
      <aside className="hidden w-64 flex-col border-r border-slate-200/80 bg-white/90 shadow-soft backdrop-blur-md md:flex">
        <div className="flex items-center gap-3 border-b border-slate-100/90 px-5 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md ring-2 ring-white/30 transition-transform duration-300 hover:scale-[1.02]">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900">QA Academy</p>
            <p className="truncate text-xs text-slate-500">{userName}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ href, label, icon: Icon }) => {
            const base = href.split("#")[0];
            const wantsHash = href.includes("#");
            const active =
              href.startsWith("/dashboard/playground")
                ? pathname === "/dashboard/playground"
                : pathname === "/dashboard" && base === "/dashboard"
                  ? wantsHash
                    ? hash === "#dersler"
                    : !hash || hash === ""
                  : false;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    active ? "text-white" : "text-slate-400 group-hover:scale-110 group-hover:text-indigo-600"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100/90 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
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
          <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[min(18rem,100%)] flex-col border-r border-slate-200/80 bg-white shadow-lift animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="font-semibold text-slate-900">Menyu</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {links.map(({ href, label, icon: Icon }) => {
                const base = href.split("#")[0];
                const wantsHash = href.includes("#");
                const active =
                  href.startsWith("/dashboard/playground")
                    ? pathname === "/dashboard/playground"
                    : pathname === "/dashboard" && base === "/dashboard"
                      ? wantsHash
                        ? hash === "#dersler"
                        : !hash || hash === ""
                      : false;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-50"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
              >
                <LogOut className="h-4 w-4" />
                Çıxış
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold tracking-tight text-slate-800">{title}</span>
        </header>
        <main className="flex-1 p-5 md:p-10">{children}</main>
      </div>
    </div>
  );
}
