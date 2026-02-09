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

  const stats = [
    { icon: '🏆', label: 'ŽEBŘÍČEK', value: `1. ${weeklyLeader.name} ${weeklyLeader.emoji}` },
    { icon: '📅', label: 'TÝDENNÍ SOUČET', value: `${weeklyTotal} Bobníků` },
    { icon: '📊', label: 'PRŮMĚR / DEN', value: `${avgPerDay} denně` },
    { icon: '🔥', label: 'NEJDELŠÍ STREAK', value: `${bestStreak} dní v kuse` },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-stats-bg rounded-xl">
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col items-center text-center p-2.5 bg-card rounded-lg">
          <span className="text-lg mb-0.5">{stat.icon}</span>
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{stat.label}</span>
          <span className="text-xs font-semibold text-foreground mt-0.5">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
