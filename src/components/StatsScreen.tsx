import { Member } from '@/hooks/useBobnikStore';
import { useState, useMemo } from 'react';

interface StatsScreenProps {
  members: Member[];
  getCountInRange: (memberId: string, days: number) => number;
  getAllTimeCount: (memberId: string) => number;
  getStreak: (memberId: string) => number;
  getHeatmapData: (memberId: string | null, days?: number) => { date: Date; count: number }[];
  onClose: () => void;
}

type Period = 'today' | '7' | '30' | 'all';

export function StatsScreen({
  members,
  getCountInRange,
  getAllTimeCount,
  getStreak,
  getHeatmapData,
  onClose,
}: StatsScreenProps) {
  const [period, setPeriod] = useState<Period>('7');
  const [heatmapMember, setHeatmapMember] = useState<string | null>(null);

  const leaderboard = useMemo(() => {
    const getCount = (mid: string) => {
      if (period === 'today') return getCountInRange(mid, 1);
      if (period === '7') return getCountInRange(mid, 7);
      if (period === '30') return getCountInRange(mid, 30);
      return getAllTimeCount(mid);
    };
    return [...members]
      .map(m => ({ ...m, count: getCount(m.id) }))
      .sort((a, b) => b.count - a.count);
  }, [members, period, getCountInRange, getAllTimeCount]);

  const heatmap = useMemo(() => getHeatmapData(heatmapMember, 90), [heatmapMember, getHeatmapData]);
  const maxHeat = Math.max(...heatmap.map(d => d.count), 1);

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Dnes' },
    { key: '7', label: '7 dní' },
    { key: '30', label: '30 dní' },
    { key: 'all', label: 'Celkem' },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">📊 Statistiky</h1>
          <button onClick={onClose} className="text-muted-foreground text-xl p-1">✕</button>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-4">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                period === p.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Žebříček</h2>
          <div className="space-y-1.5">
            {leaderboard.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 bg-card rounded-lg px-3 py-2.5">
                <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="text-xl">{m.emoji}</span>
                <span className="font-semibold text-foreground flex-1">{m.name}</span>
                <span className="font-bold text-foreground tabular-nums">{m.count}</span>
                <span className="text-xs text-muted-foreground">💩</span>
              </div>
            ))}
          </div>
        </div>

        {/* Member stats */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Přehledy</h2>
          <div className="space-y-1.5">
            {members.map(m => {
              const avg7 = (getCountInRange(m.id, 7) / 7).toFixed(1);
              const avg30 = (getCountInRange(m.id, 30) / 30).toFixed(1);
              const streak = getStreak(m.id);
              return (
                <div key={m.id} className="bg-card rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{m.emoji}</span>
                    <span className="font-semibold text-foreground">{m.name}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Ø7: <b className="text-foreground">{avg7}</b>/den</span>
                    <span>Ø30: <b className="text-foreground">{avg30}</b>/den</span>
                    <span>🔥 <b className="text-foreground">{streak}</b> dní</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Heatmapa (90 dní)</h2>
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button
              onClick={() => setHeatmapMember(null)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                heatmapMember === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              Všichni
            </button>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setHeatmapMember(m.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  heatmapMember === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {m.emoji} {m.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(13,1fr)] gap-[3px]">
            {heatmap.map((day, i) => {
              const intensity = day.count / maxHeat;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor:
                      day.count === 0
                        ? 'hsl(var(--dot-empty))'
                        : `hsl(var(--dot-filled) / ${0.25 + intensity * 0.75})`,
                  }}
                  title={`${day.date.toLocaleDateString('cs')}: ${day.count}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
