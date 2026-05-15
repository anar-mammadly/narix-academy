import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Calendar, Video, BookOpen, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { label: string; icon: any; badge: string }> = {
  CLASS: { label: "Dərs", icon: BookOpen, badge: "badge-blue" },
  EXAM: { label: "İmtahan", icon: AlertCircle, badge: "badge-red" },
  DEADLINE: { label: "Son tarix", icon: Clock, badge: "badge-yellow" },
  OTHER: { label: "Digər", icon: Calendar, badge: "badge-gray" },
};

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const events = await prisma.calendarEvent.findMany({
    where: { startAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    orderBy: { startAt: "asc" },
    include: { createdBy: { select: { name: true } } },
  });

  const now = new Date();
  const upcoming = events.filter(e => e.startAt >= now);
  const past = events.filter(e => e.startAt < now);

  function formatDateTime(d: Date) {
    return new Date(d).toLocaleString("az-AZ", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    });
  }

  function EventCard({ event }: { event: any }) {
    const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.OTHER;
    const Icon = cfg.icon;
    return (
      <div className="card flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{event.title}</span>
            <div className={`badge ${cfg.badge}`}>{cfg.label}</div>
          </div>
          <div className="text-sm text-muted mt-0.5">{formatDateTime(event.startAt)}</div>
          {event.description && <p className="text-sm text-gray-700 mt-1">{event.description}</p>}
          {event.meetLink && (
            <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 hover:underline font-medium">
              <Video size={14} /> Meet-ə qoşul
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={24} className="text-blue-600" /> Təqvim
        </h1>
        <p className="text-muted mt-1">Dərslər, imtahanlar və son tarixlər</p>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Gələcək tədbirlər</h2>
          <div className="space-y-3">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3 text-muted">Keçmiş tədbirlər</h2>
          <div className="space-y-3 opacity-60">
            {past.slice(-5).reverse().map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="card text-center text-muted py-10">Hələ heç bir tədbir planlaşdırılmayıb</div>
      )}
    </div>
  );
}
