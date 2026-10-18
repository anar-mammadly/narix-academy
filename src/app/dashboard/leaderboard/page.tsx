import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crown, Flame, Zap } from "lucide-react";
import { getSession } from "@/lib/auth";
import { leaderboard, type BoardRow } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Liderlər" };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const range = (await searchParams).range === "all" ? "all" : "week";
  const rows = await leaderboard(range);
  const me = rows.find((r) => r.userId === session.userId);
  const podium = rows.slice(0, 3).filter((r) => r.xp > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Liderlər"
        description={range === "week" ? "Son 7 gündə qazanılan XP — hər gün öyrənən önə keçir." : "Bütün zamanlar üzrə ümumi XP."}
        actions={
          <div role="tablist" aria-label="Dövr" className="inline-flex rounded-lg bg-surface-2 p-1">
            {[{ v: "week", l: "Bu həftə" }, { v: "all", l: "Ümumi" }].map((t) => (
              <Link
                key={t.v}
                role="tab"
                aria-selected={range === t.v}
                href={t.v === "week" ? "/dashboard/leaderboard" : "/dashboard/leaderboard?range=all"}
                className={cn("flex h-9 items-center rounded-md px-4 text-sm font-medium", range === t.v ? "bg-surface text-ink shadow-pop" : "text-muted hover:text-ink")}
              >
                {t.l}
              </Link>
            ))}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Hələ heç kim yoxdur" description="İlk XP-ni qazan və cədvəlin başına keç." />
      ) : (
        <>
          {podium.length === 3 && (
            <ol className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="İlk üçlük">
              {[podium[1], podium[0], podium[2]].map((r) => (
                <li key={r.userId} className="flex flex-col items-center text-center">
                  <div className="relative">
                    {r.rank === 1 && <Crown className="absolute -top-6 left-1/2 h-6 w-6 -translate-x-1/2 fill-xp-bright text-xp" aria-hidden />}
                    <Avatar name={r.name} src={r.avatarUrl} size={r.rank === 1 ? "xl" : "lg"} className="ring-4 ring-surface" />
                  </div>
                  <p className="mt-2 max-w-full truncate text-sm font-semibold text-ink">{r.name}</p>
                  <p className="flex items-center gap-1 text-xs font-semibold text-xp"><Zap className="h-3.5 w-3.5 fill-current" aria-hidden /> {r.xp}</p>
                  <div
                    className={cn(
                      "mt-2 grid w-full place-items-center rounded-t-xl font-display text-xl font-semibold",
                      r.rank === 1 ? "h-24 bg-xp-bright text-[#3a2500]" : r.rank === 2 ? "h-16 bg-surface-3 text-ink" : "h-12 bg-flame-soft text-flame"
                    )}
                  >
                    {r.rank}
                  </div>
                </li>
              ))}
            </ol>
          )}

          <ol className="overflow-clip rounded-2xl border border-line bg-surface" aria-label="Reytinq">
            {rows.map((r) => <Row key={r.userId} r={r} me={r.userId === session.userId} />)}
          </ol>

          {me && me.rank > 10 && (
            <div className="sticky bottom-20 mt-4 lg:bottom-4">
              <ol className="overflow-clip rounded-2xl border border-iris/40 bg-surface shadow-lift"><Row r={me} me /></ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ r, me }: { r: BoardRow; me: boolean }) {
  return (
    <li className={cn("flex items-center gap-3 border-b border-line px-4 py-3 last:border-0", me && "bg-iris-soft/60")}>
      <span className={cn("w-7 shrink-0 text-center font-display text-sm font-semibold", r.rank <= 3 ? "text-xp" : "text-muted")}>{r.rank}</span>
      <Avatar name={r.name} src={r.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{r.name}{me && <span className="ml-1.5 text-xs font-medium text-iris">(sən)</span>}</p>
        <p className="text-xs text-muted">Səviyyə {r.level}</p>
      </div>
      {r.streak > 0 && (
        <span className="hidden items-center gap-1 text-sm font-medium text-flame xs:flex" title="Ardıcıl günlər">
          <Flame className="h-4 w-4" aria-hidden /> {r.streak}
        </span>
      )}
      <span className="flex w-20 items-center justify-end gap-1 font-semibold tabular-nums text-ink">
        <Zap className="h-4 w-4 fill-xp-bright text-xp-bright" aria-hidden /> {r.xp}
      </span>
    </li>
  );
}
