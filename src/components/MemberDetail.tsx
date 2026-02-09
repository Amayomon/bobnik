import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface MemberDetailProps {
  member: { id: string; name: string; emoji: string; color: string };
  todayEvents: { id: string; memberId: string; createdAt: Date }[];
  weekCounts: { date: Date; count: number }[];
  streak: number;
  avg7: string;
  avg30: string;
  onClose: () => void;
}

export function MemberDetail({
  member,
  todayEvents,
  weekCounts,
  streak,
  avg7,
  avg30,
  onClose,
}: MemberDetailProps) {
  const maxWeekCount = Math.max(...weekCounts.map(d => d.count), 1);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-t-2xl p-5 pb-8 animate-slide-up shadow-xl"
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

        <div className="mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Dnes</h3>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Zatím žádný bobník 🧐</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {todayEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  💩 {format(ev.createdAt, 'HH:mm')}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Posledních 7 dní</h3>
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
          <div className="bg-stats-bg rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Streak</div>
            <div className="text-lg font-bold text-foreground">🔥 {streak}</div>
          </div>
          <div className="bg-stats-bg rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Ø 7 dní</div>
            <div className="text-lg font-bold text-foreground">{avg7}</div>
          </div>
          <div className="bg-stats-bg rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Ø 30 dní</div>
            <div className="text-lg font-bold text-foreground">{avg30}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
