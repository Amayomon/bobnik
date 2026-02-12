import { useLongPress } from '@/hooks/useLongPress';
import { useState } from 'react';

interface MemberRowProps {
  member: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
  todayCount: number;
  weekDots: boolean[];
  onLongPress: () => void;
  onTap: () => void;
}

function getMicroTitle(count: number): string {
  if (count === 0) return 'Tichý pozorovatel';
  if (count === 1) return 'Kosmická šlupka';
  if (count === 2) return 'Dvojitý portál';
  if (count === 3) return 'Polní dělostřelectvo';
  return 'Obléhací specialista';
}

export function MemberRow({
  member,
  todayCount,
  weekDots,
  onLongPress,
  onTap
}: MemberRowProps) {
  const [bumping, setBumping] = useState(false);
  const {
    pressing,
    handlers
  } = useLongPress({
    threshold: 500,
    onLongPress: () => {
      onLongPress();
      setBumping(true);
      setTimeout(() => setBumping(false), 300);
    },
    onShortPress: onTap
  });

  return (
    <div
      {...handlers}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer select-none transition-colors duration-150 ${pressing ? 'bg-row-active scale-[0.97]' : 'hover:bg-row-hover'} press-scale`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-2xl" role="img">{member.emoji}</span>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-foreground truncate">{member.name}</span>
          <span className="text-xs text-muted-foreground/70 truncate">{getMicroTitle(todayCount)}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center bg-primary/8 rounded-full px-3 py-1 gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">Denní úroda</span>
          <span className={`text-lg font-bold text-foreground tabular-nums leading-none ${bumping ? 'animate-count-bump' : ''}`}>
            {todayCount}
          </span>
        </div>

        <div className="flex gap-1 items-center">
          {weekDots.map((filled, i) => {
            const isToday = i === weekDots.length - 1;
            return (
              <div
                key={i}
                className={`rounded-full ${filled ? 'bg-dot-filled' : 'bg-dot-empty/40'} ${isToday ? 'w-2.5 h-2.5' : 'w-2 h-2'}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}