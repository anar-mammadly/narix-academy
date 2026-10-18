"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, type ReactNode } from "react";
import {
  Award, CalendarDays, ClipboardList, Flame, LayoutDashboard, LogOut, Map, Menu,
  MessageCircle, NotebookPen, Repeat, Trophy, User, Users, X, Zap, BookOpen, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { levelFromXp } from "@/lib/game";
import { Logo } from "./Logo";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: number };
type NavGroup = { label?: string; items: NavItem[] };

export type ShellUser = { name: string; avatarUrl?: string | null; xp?: number; streak?: number; reviewDue?: number };

function studentNav(reviewDue = 0): NavGroup[] {
  return [
    {
      items: [
        { href: "/dashboard", label: "Ana səhifə", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/lessons", label: "Öyrənmə yolu", icon: Map },
        { href: "/dashboard/review", label: "Təkrar", icon: Repeat, badge: reviewDue },
        { href: "/dashboard/leaderboard", label: "Liderlər", icon: Trophy },
      ],
    },
    {
      label: "Mənim",
      items: [
        { href: "/dashboard/homework", label: "Ev tapşırıqları", icon: ClipboardList },
        { href: "/dashboard/notes", label: "Qeydlər", icon: NotebookPen },
        { href: "/dashboard/questions", label: "Suallar", icon: MessageCircle },
        { href: "/dashboard/calendar", label: "Təqvim", icon: CalendarDays },
        { href: "/dashboard/certificate", label: "Sertifikat", icon: Award },
      ],
    },
  ];
}

const STUDENT_TABS: NavItem[] = [
  { href: "/dashboard", label: "Əsas", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/lessons", label: "Yol", icon: Map },
  { href: "/dashboard/review", label: "Təkrar", icon: Repeat },
  { href: "/dashboard/leaderboard", label: "Liderlər", icon: Trophy },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

const TEACHER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Ümumi baxış", icon: LayoutDashboard, exact: true },
      { href: "/admin/modules", label: "Modullar və dərslər", icon: BookOpen },
      { href: "/admin/students", label: "Tələbələr", icon: Users },
    ],
  },
  {
    label: "İş axını",
    items: [
      { href: "/admin/homework", label: "Tapşırıqlar", icon: ClipboardList },
      { href: "/admin/questions", label: "Suallar", icon: MessageCircle },
      { href: "/admin/calendar", label: "Təqvim", icon: CalendarDays },
    ],
  },
];

export function AppShell({ role, user, children }: { role: "STUDENT" | "TEACHER"; user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const groups = role === "STUDENT" ? studentNav(user.reviewDue) : TEACHER_NAV;
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <SidebarNav groups={groups} isActive={isActive} onNavigate={() => setOpen(false)} />
  );
  const footer = (
    <SidebarFooter role={role} user={user} profileActive={isActive("/dashboard/profile")} onLogout={logout} onNavigate={() => setOpen(false)} />
  );

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-[60] rounded-md bg-iris px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Məzmuna keç
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href={role === "STUDENT" ? "/dashboard" : "/admin"} aria-label="Narix Academy — ana səhifə"><Logo /></Link>
          <ThemeToggle />
        </div>
        {role === "STUDENT" && <GameCard user={user} />}
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur-md lg:hidden">
        <Link href={role === "STUDENT" ? "/dashboard" : "/admin"} className="mr-auto" aria-label="Narix Academy — ana səhifə"><Logo compact /></Link>
        {role === "STUDENT" && (
          <>
            <span className="flex items-center gap-1 rounded-full bg-flame-soft px-2.5 py-1 text-sm font-semibold text-flame">
              <Flame className="h-4 w-4" aria-hidden /> {user.streak ?? 0}<span className="sr-only"> gün ardıcıl</span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-xp-soft px-2.5 py-1 text-sm font-semibold text-xp">
              <Zap className="h-4 w-4 fill-current" aria-hidden /> {user.xp ?? 0}<span className="sr-only"> XP</span>
            </span>
          </>
        )}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="grid h-10 w-10 place-items-center rounded-lg text-ink-2 hover:bg-surface-2" aria-label="Menyunu aç">
            <Menu className="h-5 w-5" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0b0c1d]/50 lg:hidden" />
            <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-80 flex-col bg-surface shadow-lift focus:outline-none lg:hidden">
              <div className="flex h-14 items-center justify-between px-4">
                <Dialog.Title asChild><span><Logo /></span></Dialog.Title>
                <div className="flex items-center">
                  <ThemeToggle />
                  <Dialog.Close className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Menyunu bağla">
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>
              </div>
              {role === "STUDENT" && <GameCard user={user} />}
              {nav}
              {footer}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <main id="main" className={cn("lg:pl-64", role === "STUDENT" && "pb-24 lg:pb-0")}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>

      {/* Mobile tab bar (students) */}
      {role === "STUDENT" && (
        <nav aria-label="Əsas naviqasiya" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {STUDENT_TABS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium", active ? "text-iris" : "text-muted")}
                  >
                    <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-colors", active && "bg-iris-soft")}>
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
                    </span>
                    {label}
                    {href === "/dashboard/review" && (user.reviewDue ?? 0) > 0 && (
                      <span className="absolute right-[22%] top-2 h-2.5 w-2.5 rounded-full border-2 border-surface bg-bug-bright" aria-label={`${user.reviewDue} təkrar gözləyir`} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

function SidebarNav({ groups, isActive, onNavigate }: { groups: NavGroup[]; isActive: (h: string, e?: boolean) => boolean; onNavigate: () => void }) {
  return (
    <nav aria-label="Bölmələr" className="flex-1 overflow-y-auto px-3 py-3">
      {groups.map((g, gi) => (
        <div key={gi} className={cn(gi > 0 && "mt-5")}>
          {g.label && <p className="mb-1.5 px-3 text-xs font-medium text-muted">{g.label}</p>}
          <ul className="grid gap-0.5">
            {g.items.map(({ href, label, icon: Icon, exact, badge }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-[0.94rem] font-medium transition-colors",
                      active ? "bg-iris-soft text-iris-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.4 : 2} aria-hidden />
                    <span className="flex-1 truncate">{label}</span>
                    {!!badge && <span className="rounded-full bg-bug px-1.5 text-xs font-semibold text-white">{badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function GameCard({ user }: { user: ShellUser }) {
  const lvl = levelFromXp(user.xp ?? 0);
  return (
    <Link href="/dashboard/profile" className="mx-3 mb-1 block rounded-xl border border-line bg-surface-2/60 p-3.5 transition-colors hover:border-iris/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Səviyyə {lvl.level}</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-flame"><Flame className="h-3.5 w-3.5" aria-hidden /> {user.streak ?? 0} gün</span>
      </div>
      <p className="mt-0.5 font-display text-sm font-semibold text-ink">{lvl.title}</p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={lvl.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Növbəti səviyyəyə qədər">
        <div className="h-full rounded-full bg-gradient-to-r from-iris to-sky-bright" style={{ width: `${lvl.progress}%` }} />
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
        <Zap className="h-3.5 w-3.5 fill-xp-bright text-xp-bright" aria-hidden /> {user.xp ?? 0} / {lvl.next} XP
      </p>
    </Link>
  );
}

function SidebarFooter({
  role, user, profileActive, onLogout, onNavigate,
}: { role: "STUDENT" | "TEACHER"; user: ShellUser; profileActive: boolean; onLogout: () => void; onNavigate: () => void }) {
  const inner = (
    <>
      <Avatar name={user.name} src={user.avatarUrl} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
        <span className="block text-xs text-muted">{role === "STUDENT" ? "Tələbə" : "Müəllim"}</span>
      </span>
    </>
  );
  return (
    <div className="flex items-center gap-1 border-t border-line p-3">
      {role === "STUDENT" ? (
        <Link href="/dashboard/profile" onClick={onNavigate} className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 hover:bg-surface-2", profileActive && "bg-surface-2")}>
          {inner}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 p-1.5">{inner}</div>
      )}
      <button onClick={onLogout} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-bug-soft hover:text-bug" aria-label="Çıxış">
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

