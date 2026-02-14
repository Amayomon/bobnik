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

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-card rounded-xl shadow-[0_2px_8px_hsl(var(--foreground)/0.06)]">
      <span className="text-sm font-semibold text-foreground truncate">
        🏆 1. {weeklyLeader.name}
      </span>
      <span className="text-muted-foreground text-xs">|</span>
      <span className="text-sm text-foreground whitespace-nowrap">📅 {weeklyTotal}</span>
      <span className="text-muted-foreground text-xs">|</span>
      <span className="text-sm text-foreground whitespace-nowrap">📊 {avgPerDay}</span>
      <span className="text-muted-foreground text-xs">|</span>
      <span className="text-sm text-foreground whitespace-nowrap">🔥 {bestStreak}</span>
    </div>
  );
}
