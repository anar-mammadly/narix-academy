import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Clock, Flame, Lock, Repeat, Target, Trophy, Zap } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flattenPath, getStudentPath } from "@/lib/curriculum";
import { leaderboard, weekActivity } from "@/lib/stats";
import { ACHIEVEMENTS, levelFromXp } from "@/lib/game";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/ProgressBar";
import { ModuleIcon } from "@/components/game/ModuleIcon";
import { AchievementBadge } from "@/components/game/AchievementBadge";

const WEEKDAY = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Baku" }).format(new Date()));
  return h < 5 ? "Gecən xeyrə" : h < 12 ? "Sabahın xeyir" : h < 18 ? "Günün xeyir" : "Axşamın xeyir";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [path, user, week, reviewDue, owned, board] = await Promise.all([
    getStudentPath(session.userId),
    prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { name: true, xp: true, streakCount: true, longestStreak: true, dailyGoalXp: true } }),
    weekActivity(session.userId),
    prisma.reviewItem.count({ where: { userId: session.userId, dueAt: { lte: new Date() } } }),
    prisma.userAchievement.findMany({ where: { userId: session.userId }, orderBy: { unlockedAt: "desc" } }),
    leaderboard("week"),
  ]);

  const lessons = flattenPath(path);
  const next = lessons.find((l) => l.status === "current") ?? lessons.find((l) => l.status === "open");
  const done = lessons.filter((l) => l.status === "done").length;
  const level = levelFromXp(user.xp);
  const today = week.at(-1)?.xp ?? 0;
  const goalPct = Math.min(100, (today / user.dailyGoalXp) * 100);
  const myRank = board.find((r) => r.userId === session.userId);
  const ownedKeys = new Set(owned.map((o) => o.key));
  const nextAchievements = ACHIEVEMENTS.filter((a) => !ownedKeys.has(a.key)).slice(0, 3);
  const recentAchievements = owned.slice(0, 3).map((o) => ACHIEVEMENTS.find((a) => a.key === o.key)).filter(Boolean);
  const firstName = user.name.split(" ")[0];
  const weekDayIndex = (d: string) => (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-muted">{greeting()},</p>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{firstName}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Continue */}
        <section aria-label="Davam et" className="relative overflow-clip rounded-2xl border border-line bg-surface p-5 sm:p-7 lg:col-span-2">
          {next ? (
            <>
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl" style={{ background: next.moduleColor }} />
              <p className="relative flex items-center gap-2 text-sm font-medium text-ink-2">
                <span className="h-2 w-2 rounded-full" style={{ background: next.moduleColor }} aria-hidden /> {next.moduleTitle}
              </p>
              <h2 className="relative mt-3 max-w-xl font-display text-xl font-semibold text-ink sm:text-2xl">{next.title}</h2>
              {next.shortDescription && <p className="relative mt-2 max-w-xl text-ink-2">{next.shortDescription}</p>}
              <div className="relative mt-6 flex flex-wrap items-center gap-4">
                <Link href={`/learn/${next.slug}`} className={buttonStyles({ size: "lg" })}>
                  {done === 0 ? "Başla" : "Davam et"} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <span className="flex items-center gap-1.5 text-sm text-muted"><Clock className="h-4 w-4" aria-hidden /> {next.estimatedMinutes} dəq</span>
              </div>
            </>
          ) : lessons.length ? (
            <div className="py-6 text-center">
              <Trophy className="mx-auto h-10 w-10 text-xp" aria-hidden />
              <h2 className="mt-3 font-display text-xl font-semibold">Bütün dərsləri bitirdin!</h2>
              <p className="mt-1 text-ink-2">Sertifikatını götür və bilikləri “Təkrar”da təzə saxla.</p>
              <Link href="/dashboard/certificate" className={cn(buttonStyles(), "mt-4")}>Sertifikata bax</Link>
            </div>
          ) : (
            <p className="text-ink-2">Dərslər tezliklə əlavə olunacaq.</p>
          )}
        </section>

        {/* Level */}
        <Link href="/dashboard/profile" className="group flex items-center gap-5 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-iris/40 lg:flex-col lg:items-start lg:justify-between">
          <ProgressRing value={level.progress} size={96} stroke={9} tone="iris" label="Növbəti səviyyəyə qədər">
            <span className="text-center leading-none">
              <span className="block text-[0.65rem] font-medium text-muted">Səviyyə</span>
              <span className="font-display text-2xl font-semibold text-ink">{level.level}</span>
            </span>
          </ProgressRing>
          <div>
            <p className="font-display font-semibold text-ink">{level.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Zap className="h-4 w-4 fill-xp-bright text-xp-bright" aria-hidden /> {user.xp} XP · növbəti səviyyəyə {level.next - user.xp}
            </p>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Streak */}
        <section aria-label="Ardıcıl günlər" className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Ardıcıl günlər</p>
              <p className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
                <Flame className={cn("h-7 w-7", user.streakCount ? "fill-flame-bright text-flame" : "text-muted")} aria-hidden /> {user.streakCount}
              </p>
            </div>
            <span className="text-xs text-muted">Rekord: {user.longestStreak}</span>
          </div>
          <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Son 7 gün">
            {week.map((d) => (
              <li key={d.day} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full text-xs",
                    d.xp > 0 ? "bg-flame-bright text-[#3a1600]" : "bg-surface-2 text-muted",
                    d.today && "ring-2 ring-flame-bright ring-offset-2 ring-offset-surface"
                  )}
                  aria-label={`${WEEKDAY[weekDayIndex(d.day)]}: ${d.xp > 0 ? `${d.xp} XP` : "fəaliyyət yoxdur"}`}
                >
                  {d.xp > 0 ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : null}
                </span>
                <span className="text-[0.68rem] text-muted" aria-hidden>{WEEKDAY[weekDayIndex(d.day)]}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Daily goal */}
        <section aria-label="Gündəlik hədəf" className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-5">
          <ProgressRing value={goalPct} size={84} stroke={8} tone={goalPct >= 100 ? "pass" : "xp"} label="Gündəlik hədəf">
            {goalPct >= 100 ? <Check className="h-7 w-7 text-pass" strokeWidth={3} aria-hidden /> : <Target className="h-7 w-7 text-xp" aria-hidden />}
          </ProgressRing>
          <div>
            <p className="text-sm font-medium text-muted">Bugünkü hədəf</p>
            <p className="font-display text-2xl font-semibold text-ink">{today}<span className="text-base text-muted"> / {user.dailyGoalXp} XP</span></p>
            <p className="mt-1 text-sm text-ink-2">{goalPct >= 100 ? "Hədəf tamamlandı. Əla!" : "Bir dərs və ya təkrar kifayətdir."}</p>
          </div>
        </section>

        {/* Review */}
        <section aria-label="Təkrar" className={cn("flex flex-col justify-between rounded-2xl border p-5 sm:col-span-2 lg:col-span-1", reviewDue ? "border-iris/30 bg-iris-soft/60" : "border-line bg-surface")}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-iris text-white"><Repeat className="h-5 w-5" aria-hidden /></span>
            <div>
              <p className="font-semibold text-ink">{reviewDue ? `${reviewDue} sual təkrar gözləyir` : "Təkrar üçün sual yoxdur"}</p>
              <p className="text-sm text-ink-2">{reviewDue ? "Səhv etdiyin sualları qısa məşqlə möhkəmlət." : "Quizdə səhv etdiyin suallar bura düşür."}</p>
            </div>
          </div>
          {reviewDue > 0 && <Link href="/dashboard/review" className={cn(buttonStyles({ variant: "primary" }), "mt-4 self-start")}>Təkrara başla</Link>}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Modules */}
        <section aria-label="Modullar" className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Modullar</h2>
            <Link href="/dashboard/lessons" className="text-sm font-medium text-iris hover:underline">Hamısı</Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {path.map((m) => {
              const locked = m.lessons.every((l) => l.status === "locked");
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white" style={{ background: locked ? "var(--c-surface-3)" : m.color }}>
                    {locked ? <Lock className="h-4 w-4 text-muted" aria-hidden /> : <ModuleIcon name={m.icon} className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{m.title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar value={(m.done / m.lessons.length) * 100} size="sm" tone={m.done === m.lessons.length ? "pass" : "iris"} label={m.title} />
                      <span className="shrink-0 text-xs text-muted">{m.done}/{m.lessons.length}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid gap-4">
          {/* Weekly rank */}
          <Link href="/dashboard/leaderboard" className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-iris/40">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-xp-soft"><Trophy className="h-6 w-6 text-xp" aria-hidden /></span>
            <div>
              <p className="text-sm font-medium text-muted">Bu həftə</p>
              <p className="font-display text-lg font-semibold text-ink">{myRank ? `${myRank.rank}-ci yer` : "Reytinqdə yoxsan"}</p>
              <p className="text-sm text-ink-2">{myRank ? `${myRank.xp} XP qazandın` : "XP qazan və cədvələ düş"}</p>
            </div>
          </Link>

          {/* Achievements */}
          <section aria-label="Nailiyyətlər" className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Nailiyyətlər</h2>
              <span className="text-sm text-muted">{owned.length}/{ACHIEVEMENTS.length}</span>
            </div>
            <ul className="grid gap-2">
              {recentAchievements.map((a) => a && <li key={a.key}><AchievementBadge def={a} unlocked compact /></li>)}
              {nextAchievements.slice(0, Math.max(1, 3 - recentAchievements.length)).map((a) => <li key={a.key}><AchievementBadge def={a} unlocked={false} compact /></li>)}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
