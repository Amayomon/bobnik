import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

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
  neptunes_touch: boolean;
  phantom_cone: boolean;
}

interface MemberInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface StatsScreenProps {
  members: MemberInfo[];
  events: BobnikEvent[];
  roomCreatedAt: string | null;
  getCountInRange: (memberId: string, days: number) => number;
  getAllTimeCount: (memberId: string) => number;
  getStreak: (memberId: string) => number;
  getHeatmapData: (memberId: string | null, days?: number) => { date: Date; count: number }[];
  onClose: () => void;
}

type Period = 'today' | '7' | '30' | 'all';

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ── Section header ── */
function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-foreground tracking-wide">{title}</h2>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-3.5 text-center">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold text-foreground mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Heatmap grid component (auto-scrolls to right) ── */
function HeatmapGrid({ grid, dayLabels }: {
  grid: { grid: (({ date: Date; count: number; isToday: boolean; inRange: boolean }) | null)[][]; numWeeks: number; monthLabels: { label: string; col: number }[]; maxCount: number };
  dayLabels: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [grid]);

  const cellSize = 11;
  const gap = 3;
  const gridWidth = grid.numWeeks * (cellSize + gap) - gap;

  return (
    <div
      ref={scrollRef}
      className="bg-card rounded-xl border border-border/60 p-3 mb-6 overflow-x-auto"
      style={{ scrollbarWidth: 'thin' }}
    >
      {/* Month labels */}
      <div className="flex mb-1" style={{ paddingLeft: 24 }}>
        <div className="relative" style={{ width: gridWidth, height: 14, minWidth: gridWidth }}>
          {grid.monthLabels.map((ml, i) => (
            <span
              key={i}
              className="text-[9px] text-muted-foreground absolute whitespace-nowrap"
              style={{ left: ml.col * (cellSize + gap) }}
            >
              {ml.label}
            </span>
          ))}
        </div>
      </div>
      {/* Grid */}
      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col mr-1 shrink-0" style={{ width: 20, gap }}>
          {dayLabels.map((l, i) => (
            <div key={i} className="text-[8px] text-muted-foreground/60 flex items-center justify-end" style={{ height: cellSize, width: 20 }}>
              {l}
            </div>
          ))}
        </div>
        {/* Cells */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${grid.numWeeks}, ${cellSize}px)`,
            gridTemplateRows: `repeat(7, ${cellSize}px)`,
            gap,
            minWidth: gridWidth,
          }}
        >
          {Array.from({ length: 7 }).map((_, row) =>
            Array.from({ length: grid.numWeeks }).map((_, col) => {
              const cell = grid.grid[row][col];
              if (!cell) return <div key={`${row}-${col}`} className="rounded-sm" style={{ width: cellSize, height: cellSize }} />;
              const intensity = cell.count / grid.maxCount;
              return (
                <div
                  key={`${row}-${col}`}
                  className="rounded-sm"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: !cell.inRange
                      ? 'transparent'
                      : cell.count === 0
                        ? 'hsl(var(--dot-empty))'
                        : `hsl(var(--dot-filled) / ${0.25 + intensity * 0.75})`,
                    outline: cell.isToday ? '1.5px solid hsl(var(--primary))' : undefined,
                    outlineOffset: cell.isToday ? -1 : undefined,
                  }}
                  title={cell.inRange ? `${cell.date.toLocaleDateString('cs')}: ${cell.count}` : ''}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function StatsScreen({
  members, events, roomCreatedAt, getCountInRange, getAllTimeCount, getStreak, getHeatmapData, onClose,
}: StatsScreenProps) {
  const [period, setPeriod] = useState<Period>('7');
  const [viewMode, setViewMode] = useState<'room' | string>('room');

  const periodLabel = period === 'today' ? 'Dnes' : period === '7' ? '7 dní' : period === '30' ? '30 dní' : 'Celkem';
  const scopeLabel = viewMode === 'room' ? 'Místnost' : members.find(m => m.id === viewMode)?.name ?? '';

  // Compute the actual rangeStart consistently for all sections
  const rangeStart = useMemo(() => {
    const today = getStartOfDay(new Date());
    if (period === 'today') {
      return today;
    } else if (period === 'all') {
      return roomCreatedAt ? getStartOfDay(new Date(roomCreatedAt)) : today;
    } else {
      const daysBack = period === '7' ? 7 : 30;
      const d = new Date(today);
      d.setDate(d.getDate() - (daysBack - 1));
      return d;
    }
  }, [period, roomCreatedAt]);

  // Total calendar days in range (inclusive)
  const totalDaysInRange = useMemo(() => {
    const today = getStartOfDay(new Date());
    return Math.max(1, Math.round((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }, [rangeStart]);

  /* ═══ Single source of truth: scoped + time-filtered events ═══ */
  const scopedEvents = useMemo(() => {
    const byScope = viewMode === 'room' ? events : events.filter(e => e.member_id === viewMode);
    return byScope.filter(e => new Date(e.created_at) >= rangeStart);
  }, [events, viewMode, rangeStart]);

  /* ═══ A — Souhrn ═══ */
  const summary = useMemo(() => {
    const total = scopedEvents.length;
    const avgPerDay = totalDaysInRange > 0 ? (total / totalDaysInRange).toFixed(1) : '0';
    const angelic = scopedEvents.filter(e => e.special_type === 'angelic').length;
    const demonic = scopedEvents.filter(e => e.special_type === 'demonic').length;
    const notary = scopedEvents.filter(e => e.notary_present).length;
    const notaryPct = total > 0 ? Math.round((notary / total) * 100) : 0;
    const neptunes = scopedEvents.filter(e => e.neptunes_touch).length;
    const neptunesPct = total > 0 ? Math.round((neptunes / total) * 100) : 0;
    const phantom = scopedEvents.filter(e => e.phantom_cone).length;
    const phantomPct = total > 0 ? Math.round((phantom / total) * 100) : 0;
    return { total, avgPerDay, angelic, demonic, notaryPct, neptunes, neptunesPct, phantom, phantomPct };
  }, [scopedEvents, totalDaysInRange]);

  /* ═══ B — Denní vývoj ═══ */
  const dailyChart = useMemo(() => {
    if (period === 'today') return null;
    const byScope = viewMode === 'room' ? events : events.filter(e => e.member_id === viewMode);
    const today = getStartOfDay(new Date());

    // Determine start date
    let startDate: Date;
    if (period === 'all') {
      // Use room creation date as the beginning of the timeline
      startDate = roomCreatedAt ? getStartOfDay(new Date(roomCreatedAt)) : today;
    } else {
      const daysBack = period === '7' ? 7 : 30;
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (daysBack - 1));
    }

    // Generate complete day series from startDate to today
    const data: { date: string; count: number }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= today) {
      const start = getStartOfDay(cursor);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      data.push({
        date: format(start, 'd.M.', { locale: cs }),
        count: byScope.filter(e => { const t = new Date(e.created_at); return t >= start && t < end; }).length,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return data;
  }, [events, period, viewMode, roomCreatedAt]);

  /* ═══ B2 — Vývoj statů ═══ */
  type StatKey = 'consistency' | 'smell' | 'size' | 'effort';
  type StatFilter = StatKey | 'all';
  const [statFilter, setStatFilter] = useState<StatFilter>('all');

  const statColors: Record<StatKey, string> = {
    consistency: 'hsl(220, 70%, 55%)',
    smell: 'hsl(35, 80%, 50%)',
    size: 'hsl(150, 60%, 40%)',
    effort: 'hsl(0, 65%, 55%)',
  };
  const statLabels: Record<StatKey, string> = {
    consistency: 'Konzistence',
    smell: 'Zápach',
    size: 'Velikost',
    effort: 'Úsilí',
  };
  const statKeys: StatKey[] = ['consistency', 'smell', 'size', 'effort'];

  const statsChart = useMemo(() => {
    if (period === 'today') return null;
    const byScope = viewMode === 'room' ? events : events.filter(e => e.member_id === viewMode);
    const today = getStartOfDay(new Date());

    let startDate: Date;
    if (period === 'all') {
      startDate = roomCreatedAt ? getStartOfDay(new Date(roomCreatedAt)) : today;
    } else {
      const daysBack = period === '7' ? 7 : 30;
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (daysBack - 1));
    }

    const data: { date: string; consistency: number | null; smell: number | null; size: number | null; effort: number | null; _count: number }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= today) {
      const start = getStartOfDay(cursor);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const dayEvents = byScope.filter(e => { const t = new Date(e.created_at); return t >= start && t < end; });
      const count = dayEvents.length;

      const avg = (key: StatKey): number | null => {
        const vals = dayEvents.filter(e => e[key] !== null && e[key] !== undefined);
        if (vals.length === 0) return null;
        return parseFloat((vals.reduce((s, e) => s + e[key], 0) / vals.length).toFixed(2));
      };

      data.push({
        date: format(start, 'd.M.', { locale: cs }),
        consistency: avg('consistency'),
        smell: avg('smell'),
        size: avg('size'),
        effort: avg('effort'),
        _count: count,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return data;
  }, [events, period, viewMode, roomCreatedAt]);

  const hasAnyStatData = useMemo(() => {
    if (!statsChart) return false;
    return statsChart.some(d => d.consistency !== null || d.smell !== null || d.size !== null || d.effort !== null);
  }, [statsChart]);

  /* ═══ C — Kvalita záznamů ═══ */
  const attrAvg = useMemo(() => {
    const n = scopedEvents.length;
    const avg = (key: 'consistency' | 'smell' | 'size' | 'effort') =>
      n > 0 ? parseFloat((scopedEvents.reduce((s, e) => s + e[key], 0) / n).toFixed(2)) : 0;
    return [
      { attr: 'Konzistence', avg: avg('consistency') },
      { attr: 'Zápach', avg: avg('smell') },
      { attr: 'Velikost', avg: avg('size') },
      { attr: 'Úsilí', avg: avg('effort') },
    ];
  }, [scopedEvents]);

  /* ═══ D — Žebříček ═══ */
  const leaderboard = useMemo(() => {
    const roomEvents = events.filter(e => new Date(e.created_at) >= rangeStart);

    const counts = new Map<string, number>();
    const angelics = new Map<string, number>();
    const notaries = new Map<string, number>();

    for (const e of roomEvents) {
      counts.set(e.member_id, (counts.get(e.member_id) ?? 0) + 1);
      if (e.special_type === 'angelic') angelics.set(e.member_id, (angelics.get(e.member_id) ?? 0) + 1);
      if (e.notary_present) notaries.set(e.member_id, (notaries.get(e.member_id) ?? 0) + 1);
    }

    return [...members]
      .map(m => ({
        ...m,
        count: counts.get(m.id) ?? 0,
        angelicCount: angelics.get(m.id) ?? 0,
        notaryCount: notaries.get(m.id) ?? 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.angelicCount !== a.angelicCount) return b.angelicCount - a.angelicCount;
        const aPct = a.count > 0 ? a.notaryCount / a.count : 0;
        const bPct = b.count > 0 ? b.notaryCount / b.count : 0;
        if (bPct !== aPct) return bPct - aPct;
        return a.id.localeCompare(b.id);
      });
  }, [members, events, rangeStart]);

  const myRank = viewMode !== 'room'
    ? leaderboard.findIndex(m => m.id === viewMode) + 1
    : null;

  /* ═══ E — Hnědmapa (GitHub-style) ═══ */
  const heatmapGrid = useMemo(() => {
    const heatDays = 365; // Always last 12 months, independent of time filter
    const byScope = viewMode === 'room' ? events : events.filter(e => e.member_id === viewMode);

    // Build daily counts map
    const dailyCounts = new Map<string, number>();
    for (const e of byScope) {
      const key = getStartOfDay(new Date(e.created_at)).toISOString();
      dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    }

    const today = getStartOfDay(new Date());
    const todayKey = today.toISOString();

    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - heatDays + 1);

    // Pad start to nearest previous Monday
    const startDow = startDate.getDay();
    const padStart = startDow === 0 ? 6 : startDow - 1;
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - padStart);

    // Pad end to nearest next Sunday
    const endDow = endDate.getDay();
    const padEnd = endDow === 0 ? 0 : 7 - endDow;
    const gridEnd = new Date(endDate);
    gridEnd.setDate(gridEnd.getDate() + padEnd);

    const cells: { date: Date; count: number; isToday: boolean; inRange: boolean }[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const isInRange = cursor >= startDate && cursor <= endDate;
      cells.push({
        date: new Date(cursor),
        count: dailyCounts.get(getStartOfDay(cursor).toISOString()) ?? 0,
        isToday: getStartOfDay(cursor).toISOString() === todayKey,
        inRange: isInRange,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const numWeeks = Math.ceil(cells.length / 7);
    const grid: (typeof cells[0] | null)[][] = Array.from({ length: 7 }, () => Array(numWeeks).fill(null));
    for (let i = 0; i < cells.length; i++) {
      const week = Math.floor(i / 7);
      const dow = i % 7;
      grid[dow][week] = cells[i];
    }

    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < numWeeks; w++) {
      const cell = grid[0][w];
      if (cell) {
        const m = cell.date.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ label: format(cell.date, 'LLL', { locale: cs }), col: w });
          lastMonth = m;
        }
      }
    }

    const maxCount = Math.max(...cells.map(c => c.count), 1);

    return { grid, numWeeks, monthLabels, maxCount };
  }, [events, viewMode]); // Only depends on events + scope, NOT period

  const dayLabels = ['Po', '', 'St', '', 'Pá', '', 'Ne'];

  /* ── Filter config ── */
  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Dnes' },
    { key: '7', label: '7 dní' },
    { key: '30', label: '30 dní' },
    { key: 'all', label: 'Celkem' },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-foreground tracking-tight">📊 Bobnografie</h1>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl p-1 transition-colors">✕</button>
        </div>

        {/* ── 1. Filters ── */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-3">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                period === p.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap mb-2">
          <button
            onClick={() => setViewMode('room')}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              viewMode === 'room' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Místnost
          </button>
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                viewMode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.emoji} {m.name}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground/60 mb-5">
          Rozsah: {periodLabel} · Režim: {scopeLabel}
        </p>

        {/* ── A. Souhrn období ── */}
        <SectionHeader title="Souhrn období" sub="Přehled aktivity v rámci zvoleného rozsahu." />
        <div className="grid grid-cols-2 gap-2 mb-6">
          <StatCard label="🟤 Záznamy" value={summary.total} sub="Celkový počet zaznamenaných událostí." />
          <StatCard label="📊 Ø / den" value={summary.avgPerDay} sub="Průměrná denní aktivita." />
          <StatCard label="⚖ Andělské · Ďábelské" value={`${summary.angelic} · ${summary.demonic}`} sub="Poměr světlých a temných zásahů." />
          <StatCard label="🖋 Notář" value={`${summary.notaryPct}%`} sub="Podíl oficiálně doložených záznamů." />
          <StatCard label="🌊 Neptunův polibek" value={`${summary.neptunes} (${summary.neptunesPct}%)`} sub="Porcelánový křest vodou." />
          <StatCard label="👻 Fantomská šiška" value={`${summary.phantom} (${summary.phantomPct}%)`} sub="Zmizelo beze svědků." />
        </div>

        {/* ── B. Denní vývoj ── */}
        <SectionHeader title="Denní vývoj" sub="Jak se aktivita vyvíjela v čase." />
        <div className="bg-card rounded-xl border border-border/60 p-3 mb-6">
          {period === 'today' ? (
            <div className="flex items-center justify-center h-[100px]">
              <div className="text-center">
                <span className="text-3xl font-bold text-foreground tabular-nums">{summary.total}</span>
                <p className="text-[11px] text-muted-foreground mt-1">záznamů dnes</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={dailyChart!}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={period === '30' || period === 'all' ? 'preserveStartEnd' : undefined} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={24} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── B2. Vývoj statů ── */}
        <SectionHeader title="Vývoj statů" sub="Časový průběh průměrných hodnot atributů." />
        <div className="bg-card rounded-xl border border-border/60 p-3 mb-6">
          {/* Toggle */}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5 mb-3">
            {([...statKeys, 'all'] as StatFilter[]).map(k => (
              <button
                key={k}
                onClick={() => setStatFilter(k)}
                className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-colors ${
                  statFilter === k ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {k === 'all' ? 'Vše' : statLabels[k]}
              </button>
            ))}
          </div>

          {period === 'today' ? (
            <div className="flex items-center justify-center h-[100px]">
              <p className="text-[11px] text-muted-foreground">Denní zobrazení není k dispozici.</p>
            </div>
          ) : !hasAnyStatData ? (
            <div className="flex items-center justify-center h-[100px]">
              <p className="text-[11px] text-muted-foreground">Zatím žádná data pro zobrazení.</p>
            </div>
          ) : (
            <>
              {statFilter === 'all' && (
                <div className="flex gap-3 justify-end mb-1">
                  {statKeys.map(k => (
                    <div key={k} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statColors[k] }} />
                      <span className="text-[9px] text-muted-foreground">{statLabels[k]}</span>
                    </div>
                  ))}
                </div>
              )}
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={statsChart!}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={period === '30' || period === 'all' ? 'preserveStartEnd' : undefined} />
                  <YAxis domain={[-3, 3]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={24} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number | null, name: string) => {
                      if (value === null) return ['–', statLabels[name as StatKey] ?? name];
                      return [value, statLabels[name as StatKey] ?? name];
                    }}
                  />
                  {(statFilter === 'all' ? statKeys : [statFilter]).map(k => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      stroke={statColors[k]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* ── C. Kvalita záznamů ── */}
        <SectionHeader title="Kvalita záznamů" sub="Průměrné atributy v rámci období." />
        <div className="bg-card rounded-xl border border-border/60 p-3 mb-1">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={attrAvg} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[-3, 3]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="attr" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={70} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {attrAvg.map((entry, i) => (
                  <Cell key={i} fill={entry.avg >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mb-6">− slabší · + výraznější</p>

        {/* ── D. Žebříček období ── */}
        <SectionHeader title="Žebříček období" sub="Pořadí podle aktivity v rámci zvoleného rozsahu." />
        {viewMode !== 'room' && myRank ? (
          <div className="bg-card rounded-xl border border-border/60 px-4 py-3 mb-6 text-center">
            <span className="text-sm text-muted-foreground">Pozice v místnosti: </span>
            <span className="text-lg font-bold text-foreground">#{myRank}</span>
          </div>
        ) : (
          <div className="space-y-1.5 mb-6">
            {leaderboard.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 bg-card rounded-xl border border-border/60 px-3 py-2.5">
                <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="text-xl">{m.emoji}</span>
                <span className="font-semibold text-foreground flex-1">{m.name}</span>
                <span className="font-bold text-foreground tabular-nums">{m.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── E. Hnědmapa (GitHub-style) ── */}
        <SectionHeader title="Hnědmapa" sub="Intenzita aktivity po jednotlivých dnech." />
        <HeatmapGrid grid={heatmapGrid} dayLabels={dayLabels} />
      </div>
    </div>
  );
}
