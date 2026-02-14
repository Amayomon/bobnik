import { toast } from 'sonner';

interface StatsBarProps {
  members: { id: string; name: string; emoji: string; color: string }[];
  getCountInRange: (memberId: string, days: number) => number;
  getAllTimeCount: (memberId: string) => number;
  getStreak: (memberId: string) => number;
}

export function StatsBar({ members, getCountInRange, getAllTimeCount, getStreak }: StatsBarProps) {
  if (members.length === 0) return null;

  const weeklyLeader = [...members].sort(
    (a, b) => getCountInRange(b.id, 7) - getCountInRange(a.id, 7)
  )[0];
  const weeklyTotal = members.reduce((sum, m) => sum + getCountInRange(m.id, 7), 0);
  const avgPerDay = (weeklyTotal / 7).toFixed(1);
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
