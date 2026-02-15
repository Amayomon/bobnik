import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
interface BobnikEvent {
  id: string;
  member_id: string;
  created_at: string;
  consistency: number;
  smell: number;
  size: number;
  effort: number;
  notary_present: boolean;
  special_type: string | null;
}
interface StatsScreenProps {
  members: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  }[];
  events: BobnikEvent[];
  getCountInRange: (memberId: string, days: number) => number;
  getAllTimeCount: (memberId: string) => number;
  getStreak: (memberId: string) => number;
  getHeatmapData: (memberId: string | null, days?: number) => {
    date: Date;
    count: number;
  }[];
  onClose: () => void;
}
type Period = 'today' | '7' | '30' | 'all';
function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function StatCard({
  label,
  value,
  sub
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return <div className="bg-card rounded-lg p-3 text-center">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-foreground mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>;
}
export function StatsScreen({
  members,
  events,
  getCountInRange,
  getAllTimeCount,
  getStreak,
  getHeatmapData,
  onClose
}: StatsScreenProps) {
  const [period, setPeriod] = useState<Period>('7');
  const [heatmapMember, setHeatmapMember] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'room' | string>('room');
  const periodDays = period === 'today' ? 1 : period === '7' ? 7 : period === '30' ? 30 : 365;

  // Scoped + time-filtered events — single source of truth
  const scopedEvents = useMemo(() => {
    const scopeFiltered = viewMode === 'room' ? events : events.filter(e => e.member_id === viewMode);
    const cutoff = new Date();
    if (period !== 'all') {
      cutoff.setDate(cutoff.getDate() - periodDays);
      cutoff.setHours(0, 0, 0, 0);
      return scopeFiltered.filter(e => new Date(e.created_at) >= cutoff);
    }
    return scopeFiltered;
  }, [events, viewMode, period, periodDays]);

  // KPI cards from scopedEvents
  const overview = useMemo(() => {
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const todayEvents = scopedEvents.filter(e => new Date(e.created_at) >= todayStart);

    const week = new Date(now);
    week.setDate(week.getDate() - 7);
    week.setHours(0, 0, 0, 0);
    const weekEvents = scopedEvents.filter(e => new Date(e.created_at) >= week);

    const notaryCount = scopedEvents.filter(e => e.notary_present).length;
    const angelicCount = scopedEvents.filter(e => e.special_type === 'angelic').length;
    const demonicCount = scopedEvents.filter(e => e.special_type === 'demonic').length;

    return {
      today: todayEvents.length,
      week: weekEvents.length,
      avgPerDay: (weekEvents.length / 7).toFixed(1),
      notaryRate: scopedEvents.length > 0 ? Math.round(notaryCount / scopedEvents.length * 100) : 0,
      angelic: angelicCount,
      demonic: demonicCount,
      total: scopedEvents.length,
    };
  }, [scopedEvents]);

  // Daily count chart data
  const dailyChart = useMemo(() => {
    const days = period === 'today' ? 1 : periodDays > 30 ? 30 : periodDays;
    const scopeFiltered = viewMode === 'room' ? events : events.filter(e => e.member_id === viewMode);
    const data: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = getStartOfDay(d);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const filtered = scopeFiltered.filter(e => new Date(e.created_at) >= start && new Date(e.created_at) < end);
      data.push({
        date: format(start, 'd.M.', { locale: cs }),
        count: filtered.length
      });
    }
    return data;
  }, [events, periodDays, viewMode, period]);

  // Attribute averages from scoped events
  const attrAvg = useMemo(() => {
    if (scopedEvents.length === 0) return [
      { attr: 'Konzistence', avg: 0 },
      { attr: 'Zápach', avg: 0 },
      { attr: 'Velikost', avg: 0 },
      { attr: 'Úsilí', avg: 0 },
    ];
    const avg = (key: keyof BobnikEvent) => {
      const sum = scopedEvents.reduce((s, e) => s + (e[key] as number), 0);
      return parseFloat((sum / scopedEvents.length).toFixed(2));
    };
    return [
      { attr: 'Konzistence', avg: avg('consistency') },
      { attr: 'Zápach', avg: avg('smell') },
      { attr: 'Velikost', avg: avg('size') },
      { attr: 'Úsilí', avg: avg('effort') },
    ];
  }, [scopedEvents]);

  // Leaderboard
  const leaderboard = useMemo(() => {
    const getCount = (mid: string) => {
      if (period === 'today') return getCountInRange(mid, 1);
      if (period === '7') return getCountInRange(mid, 7);
      if (period === '30') return getCountInRange(mid, 30);
      return getAllTimeCount(mid);
    };
    return [...members].map(m => ({
      ...m,
      count: getCount(m.id)
    })).sort((a, b) => b.count - a.count);
  }, [members, period, getCountInRange, getAllTimeCount]);
  const heatmap = useMemo(() => getHeatmapData(heatmapMember, 90), [heatmapMember, getHeatmapData]);
  const maxHeat = Math.max(...heatmap.map(d => d.count), 1);
  const periods: {
    key: Period;
    label: string;
  }[] = [{
    key: 'today',
    label: 'Dnes'
  }, {
    key: '7',
    label: '7 dní'
  }, {
    key: '30',
    label: '30 dní'
  }, {
    key: 'all',
    label: 'Celkem'
  }];
  return <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto p-4 pb-20">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">Statistiky</h1>
          <button onClick={onClose} className="text-muted-foreground text-xl p-1">✕</button>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-4">
          {periods.map(p => <button key={p.key} onClick={() => setPeriod(p.key)} className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${period === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {p.label}
            </button>)}
        </div>

        {/* View mode toggle */}
        <div className="flex gap-1 flex-wrap mb-4">
          <button onClick={() => setViewMode('room')} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${viewMode === 'room' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            Místnost
          </button>
          {members.map(m => <button key={m.id} onClick={() => setViewMode(m.id)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${viewMode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {m.emoji} {m.name}
            </button>)}
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <StatCard label="Dnes" value={overview.today} />
          <StatCard label="Posledních 7 dní" value={overview.week} />
          <StatCard label="Ø / den (7d)" value={overview.avgPerDay} />
          <StatCard label="Notář" value={`${overview.notaryRate}%`} sub={period === 'all' ? 'celkem' : `${periodDays}d`} />
          <StatCard label="✨ Andělské" value={overview.angelic} sub={period === 'all' ? 'celkem' : `${periodDays}d`} />
          <StatCard label="🔥 Ďábelské" value={overview.demonic} sub={period === 'all' ? 'celkem' : `${periodDays}d`} />
        </div>

        {/* Daily chart */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Denní počet</h2>
          <div className="bg-card rounded-lg p-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }} />
                <YAxis allowDecimals={false} tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }} width={24} />
                <Tooltip contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12
              }} labelStyle={{
                color: 'hsl(var(--foreground))'
              }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attribute averages */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Průměr atributů {period === 'all' ? '(celkem)' : `(${periodDays}d)`}</h2>
          <div className="bg-card rounded-lg p-3">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={attrAvg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[-3, 3]} tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }} />
                <YAxis dataKey="attr" type="category" tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }} width={70} />
                <Tooltip contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12
              }} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                  {attrAvg.map((entry, i) => <Cell key={i} fill={entry.avg >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Žebříček</h2>
          <div className="space-y-1.5">
            {leaderboard.map((m, i) => <div key={m.id} className="flex items-center gap-3 bg-card rounded-lg px-3 py-2.5">
                <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="text-xl">{m.emoji}</span>
                <span className="font-semibold text-foreground flex-1">{m.name}</span>
                <span className="font-bold text-foreground tabular-nums">{m.count}</span>
              </div>)}
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Hnědmapa (90 dní)</h2>
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button onClick={() => setHeatmapMember(null)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${heatmapMember === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              Všichni
            </button>
            {members.map(m => <button key={m.id} onClick={() => setHeatmapMember(m.id)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${heatmapMember === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {m.emoji} {m.name}
              </button>)}
          </div>
          <div className="grid grid-cols-[repeat(13,1fr)] gap-[3px]">
            {heatmap.map((day, i) => {
            const intensity = day.count / maxHeat;
            return <div key={i} className="aspect-square rounded-sm" style={{
              backgroundColor: day.count === 0 ? 'hsl(var(--dot-empty))' : `hsl(var(--dot-filled) / ${0.25 + intensity * 0.75})`
            }} title={`${day.date.toLocaleDateString('cs')}: ${day.count}`} />;
          })}
          </div>
        </div>
      </div>
    </div>;
}