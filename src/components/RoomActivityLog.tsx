import { useState, useMemo } from 'react';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';

interface RoomActivityLogProps {
  events: { id: string; member_id: string; created_at: string }[];
  members: { id: string; name: string; emoji: string }[];
  onClose: () => void;
}

type Filter = 'today' | '7' | 'all';

function groupByDay(items: { date: Date; label: string }[]) {
  const groups: { key: string; label: string; items: typeof items }[] = [];
  for (const item of items) {
    const key = startOfDay(item.date).toISOString();
    let group = groups.find(g => g.key === key);
    if (!group) {
      let label: string;
      if (isToday(item.date)) label = 'Dnes';
      else if (isYesterday(item.date)) label = 'Včera';
      else label = format(item.date, 'd. MMMM yyyy', { locale: cs });
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export function RoomActivityLog({ events, members, onClose }: RoomActivityLogProps) {
  const [filter, setFilter] = useState<Filter>('today');

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (filter === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (filter === '7') {
      cutoff.setDate(cutoff.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
    } else {
      cutoff.setFullYear(2000);
    }

    return events
      .map(e => ({ ...e, date: new Date(e.created_at) }))
      .filter(e => e.date >= cutoff && e.date <= now)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 50);
  }, [events, filter]);

  const memberMap = useMemo(() => {
    const map: Record<string, { name: string; emoji: string }> = {};
    members.forEach(m => { map[m.id] = { name: m.name, emoji: m.emoji }; });
    return map;
  }, [members]);

  const grouped = useMemo(() => {
    const items = filtered.map(e => ({
      ...e,
      label: `${memberMap[e.member_id]?.emoji ?? '💩'} ${memberMap[e.member_id]?.name ?? '?'} přidal(a) záznam v ${format(e.date, 'HH:mm')}`,
    }));
    return groupByDay(items);
  }, [filtered, memberMap]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Dnes' },
    { key: '7', label: '7 dní' },
    { key: 'all', label: 'Vše' },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">📋 Aktivita</h1>
          <button onClick={onClose} className="text-muted-foreground text-xl p-1">✕</button>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-4">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 italic">Žádné záznamy</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(group => (
              <div key={group.key}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {group.label}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card">
                      <span className="text-xs text-muted-foreground tabular-nums w-10">
                        {format(item.date, 'HH:mm')}
                      </span>
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
