import { useMemo } from 'react';
import { format } from 'date-fns';

interface RecentActivityPanelProps {
  events: { id: string; member_id: string; created_at: string }[];
  members: { id: string; name: string; emoji: string }[];
  onOpenLog: () => void;
}

export function RecentActivityPanel({ events, members, onOpenLog }: RecentActivityPanelProps) {
  const memberMap = useMemo(() => {
    const map: Record<string, { name: string; emoji: string }> = {};
    members.forEach(m => { map[m.id] = { name: m.name, emoji: m.emoji }; });
    return map;
  }, [members]);

  const recentEntries = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map(e => {
        const m = memberMap[e.member_id];
        const date = new Date(e.created_at);
        return {
          id: e.id,
          text: `${m?.emoji ?? '💩'} ${m?.name ?? '?'} přidal(a) záznam`,
          time: format(date, 'HH:mm'),
        };
      });
  }, [events, memberMap]);

  return (
    <div
      onClick={onOpenLog}
      className="relative z-30 cursor-pointer"
    >
      <div className="bg-card rounded-t-2xl shadow-[0_-4px_16px_hsl(var(--foreground)/0.08)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">📜 Poslední bobníky</span>
          <span className="text-muted-foreground text-base font-medium">›</span>
        </div>

        {/* Entries */}
        {recentEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Zatím žádné bobníky.</p>
        ) : (
          <div className="space-y-1">
            {recentEntries.map(entry => (
              <div key={entry.id} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground tabular-nums w-10">{entry.time}</span>
                <span className="text-xs text-foreground truncate">{entry.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
