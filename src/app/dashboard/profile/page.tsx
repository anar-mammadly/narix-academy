import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpenCheck, Flame, Target, Zap } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, levelFromXp } from "@/lib/game";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AchievementBadge } from "@/components/game/AchievementBadge";
import ProfileForm from "./ProfileClient";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, completed, quiz, owned] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, bio: true, avatarUrl: true, createdAt: true, xp: true, streakCount: true, longestStreak: true, dailyGoalXp: true },
    }),
    prisma.progress.count({ where: { userId: session.userId, completed: true } }),
    prisma.blockAttempt.aggregate({ where: { userId: session.userId, block: { type: "QUIZ" } }, _avg: { score: true } }),
    prisma.userAchievement.findMany({ where: { userId: session.userId } }),
  ]);
  if (!user) redirect("/login");

  const level = levelFromXp(user.xp);
  const ownedMap = new Map(owned.map((o) => [o.key, o.unlockedAt]));
  const stats = [
    { label: "Ümumi XP", value: user.xp, icon: Zap, cls: "text-xp bg-xp-soft" },
    { label: "Ardıcıl gün", value: `${user.streakCount}`, sub: `rekord ${user.longestStreak}`, icon: Flame, cls: "text-flame bg-flame-soft" },
    { label: "Bitən dərs", value: completed, icon: BookOpenCheck, cls: "text-pass bg-pass-soft" },
    { label: "Quiz ortalaması", value: quiz._avg.score != null ? `${Math.round(quiz._avg.score)}%` : "—", icon: Target, cls: "text-iris bg-iris-soft" },
  ];

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:p-7">
        <Avatar name={user.name} src={user.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-ink">{user.name}</h1>
          <p className="text-ink-2">{level.title} · Səviyyə {level.level}</p>
          <p className="mt-0.5 text-sm text-muted">Qoşulub: {formatDate(user.createdAt)}</p>
          <div className="mt-4 max-w-md">
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">Səviyyə {level.level + 1}-ə qədər</span><span className="font-medium text-ink">{user.xp} / {level.next} XP</span></div>
            <ProgressBar value={level.progress} tone="iris" label="Səviyyə irəliləyişi" />
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.cls}`}><s.icon className="h-5 w-5" aria-hidden /></span>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}{s.sub ? ` · ${s.sub}` : ""}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="ach-title">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="ach-title" className="font-display text-lg font-semibold text-ink">Nailiyyətlər</h2>
          <span className="text-sm text-muted">{owned.length} / {ACHIEVEMENTS.length}</span>
        </div>
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[...ACHIEVEMENTS].sort((a, b) => Number(ownedMap.has(b.key)) - Number(ownedMap.has(a.key))).map((a) => (
            <li key={a.key}>
              <AchievementBadge def={a} unlocked={ownedMap.has(a.key)} date={ownedMap.has(a.key) ? formatDate(ownedMap.get(a.key)!) : undefined} />
            </li>
          ))}
        </ul>
      </section>

      <ProfileForm initial={{ name: user.name, bio: user.bio ?? "", dailyGoalXp: user.dailyGoalXp }} email={user.email} />
    </div>
  );
}
