import {
  Code2, Crown, FileWarning, Flame, Footprints, Lock, Medal, Network, Repeat, Rocket, Target, Bug, Zap, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementDef } from "@/lib/game";

const ICONS: Record<string, LucideIcon> = { Code2, Crown, FileWarning, Flame, Footprints, Medal, Network, Repeat, Rocket, Target, Bug, Zap };

const tone: Record<AchievementDef["tone"], string> = {
  iris: "bg-iris text-white",
  pass: "bg-pass-bright text-[#06281c]",
  bug: "bg-bug-bright text-[#3d0010]",
  xp: "bg-xp-bright text-[#3a2500]",
  flame: "bg-flame-bright text-[#3a1600]",
  sky: "bg-sky-bright text-[#032a40]",
};

export function AchievementBadge({ def, unlocked, compact, date }: { def: AchievementDef; unlocked: boolean; compact?: boolean; date?: string }) {
  const Icon = ICONS[def.icon] ?? Medal;
  return (
    <div className={cn("flex items-center gap-3", !compact && "rounded-xl border border-line bg-surface p-3.5", !unlocked && "opacity-60")}>
      <span className={cn("relative grid shrink-0 place-items-center rounded-xl", compact ? "h-10 w-10" : "h-12 w-12", unlocked ? tone[def.tone] : "bg-surface-3 text-muted")}>
        <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
        {!unlocked && <Lock className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-surface p-0.5 text-muted" aria-hidden />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{def.title}<span className="sr-only">{unlocked ? " — qazanılıb" : " — hələ qazanılmayıb"}</span></p>
        <p className="truncate text-xs text-muted">{unlocked && date ? date : def.description}{def.xp > 0 && !unlocked ? ` · +${def.xp} XP` : ""}</p>
      </div>
    </div>
  );
}
