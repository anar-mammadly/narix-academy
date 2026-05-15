import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Trophy, Medal } from "lucide-react";
import { getInitials, calculateProgress } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [students, allProgress, totalLessons] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, name: true, createdAt: true } }),
    prisma.progress.findMany({ where: { user: { role: "STUDENT" } } }),
    prisma.lesson.count({ where: { published: true } }),
  ]);

  const board = students.map(s => {
    const prog = allProgress.filter(p => p.userId === s.id);
    const completed = prog.filter(p => p.completed).length;
    const passed = prog.filter(p => p.quizPassed);
    const avgScore = passed.length ? Math.round(passed.reduce((a, p) => a + (p.quizScore ?? 0), 0) / passed.length) : 0;
    const points = completed * 10 + passed.length * 5 + avgScore;
    return { ...s, completed, avgScore, points, pct: calculateProgress(completed, totalLessons) };
  }).sort((a, b) => b.points - a.points);

  const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
  const rankBg = ["bg-yellow-50 border-yellow-200", "bg-gray-50 border-gray-200", "bg-amber-50 border-amber-200"];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy size={24} className="text-yellow-500" /> Liderboard
        </h1>
        <p className="text-muted mt-1">Ən çox dərs tamamlayan tələbələr</p>
      </div>

      {/* Top 3 */}
      {board.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[board[1], board[0], board[2]].map((s, i) => {
            const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <div key={s.id} className={cn("card text-center border", rankBg[realRank - 1], realRank === 1 && "scale-105")}>
                <div className={`text-2xl font-bold ${rankColors[realRank - 1]} mb-2`}>
                  {realRank === 1 ? "🥇" : realRank === 2 ? "🥈" : "🥉"}
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold mx-auto mb-2">
                  {getInitials(s.name)}
                </div>
                <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                <div className="text-2xl font-bold text-blue-700 mt-1">{s.points}</div>
                <div className="text-xs text-muted">xal</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Yer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Tələbə</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted">Tamamlanan</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted">Ortalama bal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted">Xal</th>
            </tr>
          </thead>
          <tbody>
            {board.map((s, i) => (
              <tr key={s.id} className={cn(
                "border-b border-gray-50 hover:bg-blue-50/30 transition-colors",
                s.id === session.userId && "bg-blue-50/50"
              )}>
                <td className="px-4 py-3">
                  <span className={cn("font-bold", i < 3 ? rankColors[i] : "text-gray-400")}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i + 1}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(s.name)}
                    </div>
                    <span className="font-medium text-gray-900">{s.name}</span>
                    {s.id === session.userId && <span className="badge badge-blue text-xs">Sən</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold">{s.completed}</span>
                  <span className="text-muted">/{totalLessons}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {s.avgScore > 0 ? <span className="font-semibold text-blue-700">{s.avgScore}%</span> : <span className="text-muted">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-bold text-gray-900">{s.points}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
