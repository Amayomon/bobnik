import { toast } from 'sonner';

interface StatsBarProps {
  members: { id: string; name: string; emoji: string; color: string }[];
  getCalendarWeekCount: (memberId: string) => number;
  getAllTimeCount: (memberId: string) => number;
  getStreak: (memberId: string) => number;
}

export function StatsBar({ members, getCalendarWeekCount, getAllTimeCount, getStreak }: StatsBarProps) {
  if (members.length === 0) return null;

  const weeklyLeader = [...members].sort(
    (a, b) => getCalendarWeekCount(b.id) - getCalendarWeekCount(a.id)
  )[0];
  const weeklyTotal = members.reduce((sum, m) => sum + getCalendarWeekCount(m.id), 0);

  // Days elapsed this week so far (at least 1)
  const now = new Date();
  const day = now.getDay();
  const daysElapsed = day === 0 ? 7 : day; // Mon=1..Sun=7
  const avgPerDay = (weeklyTotal / daysElapsed).toFixed(1);
  const bestStreak = Math.max(...members.map(m => getStreak(m.id)));

  const showLabel = (label: string) => {
    toast(label, { duration: 1800 });
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-card rounded-xl shadow-[0_2px_8px_hsl(var(--foreground)/0.06)]">
      <button onClick={() => showLabel('Týdenní lídr')} className="text-sm font-semibold text-foreground truncate">
        🏆 1. {weeklyLeader.name}
      </button>
      <span className="text-muted-foreground/40 text-xs">|</span>
      <button onClick={() => showLabel('Týdenní součet')} className="text-sm text-foreground whitespace-nowrap">📅 {weeklyTotal}</button>
      <span className="text-muted-foreground/40 text-xs">|</span>
      <button onClick={() => showLabel('Denní průměr')} className="text-sm text-foreground whitespace-nowrap">📊 {avgPerDay}</button>
      <span className="text-muted-foreground/40 text-xs">|</span>
      <button onClick={() => showLabel('Nejdelší série')} className="text-sm text-foreground whitespace-nowrap">🔥 {bestStreak}</button>
    </div>
  );
}
