import { requireTeacher, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminCalendarClient from "./AdminCalendarClient";

export default async function AdminCalendarPage() {
  const session = await requireTeacher();
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startAt: "desc" },
    include: { createdBy: { select: { name: true } } },
    take: 50,
  });
  return <AdminCalendarClient events={events} teacherId={session.userId} />;
}
