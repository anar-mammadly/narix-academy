import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminCalendarClient, { type EventItem } from "./AdminCalendarClient";

export const metadata: Metadata = { title: "Təqvim" };

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export default async function AdminCalendarPage() {
  await requireTeacher();
  const since = daysAgo(60);
  const events = await prisma.calendarEvent.findMany({
    where: { startAt: { gte: since } },
    orderBy: { startAt: "asc" },
    include: { createdBy: { select: { name: true } } },
    take: 200,
  });

  const items: EventItem[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt?.toISOString() ?? null,
    type: e.type,
    meetLink: e.meetLink,
    createdBy: e.createdBy.name,
  }));

  return <AdminCalendarClient events={items} />;
}
