import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { cs } from 'date-fns/locale';

interface EventWithRatings {
  id: string;
  memberId: string;
  createdAt: Date;
  consistency?: number;
  smell?: number;
  size?: number;
  effort?: number;
  notaryPresent?: boolean;
}

interface MemberDetailProps {
  member: { id: string; name: string; emoji: string; color: string };
  todayEvents: EventWithRatings[];
  allEvents: EventWithRatings[];
  weekCounts: { date: Date; count: number }[];
  streak: number;
  avg7: string;
  avg30: string;
  onClose: () => void;
}

function groupEventsByDay(events: EventWithRatings[]) {
  const groups: { key: string; label: string; events: EventWithRatings[] }[] = [];
  const sorted = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  for (const ev of sorted) {
    const dayKey = format(ev.createdAt, 'yyyy-MM-dd');
    let group = groups.find(g => g.key === dayKey);
    if (!group) {
      let label: string;
      if (isToday(ev.createdAt)) label = 'Dnes';
      else if (isYesterday(ev.createdAt)) label = 'Včera';
      else label = format(ev.createdAt, 'd. MMMM yyyy', { locale: cs });
      group = { key: dayKey, label, events: [] };
      groups.push(group);
    }
    group.events.push(ev);
  }
  return groups;
}

const RATING_LABELS = [
  { key: 'consistency' as const, abbr: 'K' },
  { key: 'smell' as const, abbr: 'Z' },
  { key: 'size' as const, abbr: 'V' },
  { key: 'effort' as const, abbr: 'Ú' },
];

function RatingBadges({ event }: { event: EventWithRatings }) {
  const hasRatings = RATING_LABELS.some(r => (event[r.key] ?? 0) !== 0);
  const hasAnything = hasRatings || event.notaryPresent;
  const [expanded, setExpanded] = useState(false);

  if (!hasAnything) return null;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
    >
      {expanded ? (
        <>
          {RATING_LABELS.map(r => {
            const val = event[r.key] ?? 0;
            if (val === 0) return null;
            return (
              <span key={r.key} className="tabular-nums">
                {r.abbr}:{val > 0 ? `+${val}` : val}
              </span>
            );
          })}
          {event.notaryPresent && (
            <span className="text-muted-foreground border border-border rounded px-1 py-px">Notář</span>
          )}
        </>
      ) : (
        <span className="opacity-60">📊</span>
      )}
    </button>
  );
}

export function MemberDetail({
  member,
  todayEvents,
  allEvents,
  weekCounts,
  streak,
  avg7,
  avg30,
  onClose,
}: MemberDetailProps) {
  const maxWeekCount = Math.max(...weekCounts.map(d => d.count), 1);

  // Show last 30 days of events grouped by day
  const recentEvents = allEvents.filter(e => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return e.createdAt >= cutoff;
  });
  const grouped = groupEventsByDay(recentEvents);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-t-2xl p-5 pb-8 animate-slide-up shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{member.emoji}</span>
            <h2 className="text-xl font-bold text-foreground">{member.name}</h2>
            <span className="text-xl">💩</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground text-xl p-1">✕</button>
        </div>

        {/* Timeline */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Časová osa</h3>
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Zatím žádný bobník 🧐</p>
          ) : (
            <div className="space-y-3">
              {grouped.map(group => (
                <div key={group.key}>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.events.map(ev => (
                      <div key={ev.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50">
                        <span className="text-xs text-muted-foreground tabular-nums w-10">
                          {format(ev.createdAt, 'HH:mm')}
                        </span>
                        <span className="text-sm text-foreground flex-1">+1 záznam</span>
                        <RatingBadges event={ev} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Week chart */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Posledních 7 dní</h3>
          <div className="flex items-end gap-1.5 h-20">
            {weekCounts.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[28px] bg-primary/80 rounded-t-md transition-all duration-300"
                    style={{ height: `${(day.count / maxWeekCount) * 56}px`, minHeight: day.count > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {format(day.date, 'EEE', { locale: cs }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Streak</div>
            <div className="text-lg font-bold text-foreground">🔥 {streak}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Ø 7 dní</div>
            <div className="text-lg font-bold text-foreground">{avg7}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Ø 30 dní</div>
            <div className="text-lg font-bold text-foreground">{avg30}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
