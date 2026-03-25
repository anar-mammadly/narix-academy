"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/frontend/components/ui/button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} aria-label="Bağla" />
          <div className="absolute left-0 top-0 h-full w-64 animate-slide-up shadow-lift">
            <AdminSidebar />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setOpen((o) => !o)} aria-label="Menyu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-semibold text-slate-800">QA Academy</span>
        </header>
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
