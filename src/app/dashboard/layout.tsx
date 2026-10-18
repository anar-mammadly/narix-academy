import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "TEACHER") redirect("/admin");

  const [user, reviewDue] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, avatarUrl: true, xp: true, streakCount: true } }),
    prisma.reviewItem.count({ where: { userId: session.userId, dueAt: { lte: new Date() } } }),
  ]);
  if (!user) redirect("/login");

  return (
    <AppShell role="STUDENT" user={{ name: user.name, avatarUrl: user.avatarUrl, xp: user.xp, streak: user.streakCount, reviewDue }}>
      {children}
    </AppShell>
  );
}
