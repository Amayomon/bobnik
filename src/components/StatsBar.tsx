import { toast } from 'sonner';
import { useMemo } from 'react';

interface BobnikEvent {
  id: string;
  member_id: string;
  created_at: string;
  special_type: string | null;
}

interface StatsBarProps {
  members: { id: string; name: string; emoji: string; color: string }[];
  events: BobnikEvent[];
  getCalendarWeekCount: (memberId: string) => number;
  getAllTimeCount: (memberId: string) => number;
  getStreak: (memberId: string) => number;
}

export function StatsBar({ members, events, getCalendarWeekCount, getAllTimeCount, getStreak }: StatsBarProps) {
  const weeklyLeader = useMemo(() => {
    const now = new Date();
    const d = now.getDay();
    const diffToMonday = d === 0 ? 6 : d - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekEvents = events.filter(e => new Date(e.created_at) >= monday);

    return [...members].sort((a, b) => {
      const countDiff = getCalendarWeekCount(b.id) - getCalendarWeekCount(a.id);
      if (countDiff !== 0) return countDiff;
      const angelicA = weekEvents.filter(e => e.member_id === a.id && e.special_type === 'angelic').length;
      const angelicB = weekEvents.filter(e => e.member_id === b.id && e.special_type === 'angelic').length;
      if (angelicB !== angelicA) return angelicB - angelicA;
      return a.name.localeCompare(b.name);
    })[0];
  }, [members, events, getCalendarWeekCount]);

  if (members.length === 0) return null;

  const weeklyTotal = members.reduce((sum, m) => sum + getCalendarWeekCount(m.id), 0);
  const leaderCount = getCalendarWeekCount(weeklyLeader!.id);

  const now = new Date();
  const day = now.getDay();
  const daysElapsed = day === 0 ? 7 : day;
  const avgPerDay = (weeklyTotal / daysElapsed).toFixed(1);
  const bestStreak = Math.max(...members.map(m => getStreak(m.id)));

  const showLabel = (label: string) => {
    toast(label, { duration: 1800 });
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 parchment-card rounded-xl">
      <button onClick={() => showLabel('Bobkař týdne')} className="text-sm font-bold text-foreground truncate">
        🏆 {weeklyLeader.name}
      </button>
      <span className="text-muted-foreground/30 text-xs">|</span>
      <button onClick={() => showLabel('Týdenní součet')} className="text-sm text-foreground whitespace-nowrap font-semibold">📅 {weeklyTotal}</button>
      <span className="text-muted-foreground/30 text-xs">|</span>
      <button onClick={() => showLabel('Denní průměr')} className="text-sm text-foreground whitespace-nowrap font-semibold">📊 {avgPerDay}</button>
      <span className="text-muted-foreground/30 text-xs">|</span>
      <button onClick={() => showLabel('Nejdelší série')} className="text-sm text-foreground whitespace-nowrap font-semibold">🔥 {bestStreak}</button>
    </div>
  );
}
