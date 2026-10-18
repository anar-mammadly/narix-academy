import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import CalendarClient, { type CalendarEventView, type EventType } from "./CalendarClient";
import { dayKey } from "./az-date";

export const metadata = { title: "Təqvim" };

const DAY = 24 * 60 * 60 * 1000;
const TYPES: EventType[] = ["CLASS", "EXAM", "DEADLINE", "OTHER"];

/** Only plain web links are rendered as Meet buttons. */
function safeLink(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const events = await prisma.calendarEvent.findMany({
    where: { startAt: { gte: new Date(now.getTime() - 180 * DAY), lte: new Date(now.getTime() + 400 * DAY) } },
    orderBy: { startAt: "asc" },
    select: { id: true, title: true, description: true, startAt: true, endAt: true, type: true, meetLink: true },
  });

  const items: CalendarEventView[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt?.toISOString() ?? null,
    type: (TYPES as string[]).includes(e.type) ? (e.type as EventType) : "OTHER",
    meetLink: safeLink(e.meetLink),
  }));

  return (
    <>
      <PageHeader title="Təqvim" description="Canlı dərslər, imtahanlar və son tarixlər. Vaxtlar Bakı vaxtı ilədir." />
      <CalendarClient events={items} now={now.toISOString()} todayKey={dayKey(now)} />
    </>
  );
}
