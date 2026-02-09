import { Member } from '@/hooks/useBobnikStore';
import { useLongPress } from '@/hooks/useLongPress';
import { useState } from 'react';

interface MemberRowProps {
  member: Member;
  todayCount: number;
  weekDots: boolean[]; // 7 booleans, last = today
  onLongPress: () => void;
  onTap: () => void;
}

export function MemberRow({ member, todayCount, weekDots, onLongPress, onTap }: MemberRowProps) {
  const [bumping, setBumping] = useState(false);
  const { pressing, handlers } = useLongPress({
    threshold: 500,
    onLongPress: () => {
      onLongPress();
      setBumping(true);
      setTimeout(() => setBumping(false), 300);
    },
    onShortPress: onTap,
  });

  return (
    <div
      {...handlers}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer select-none transition-colors duration-150 ${
        pressing ? 'bg-row-active scale-[0.97]' : 'hover:bg-row-hover'
      } press-scale`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-2xl" role="img" aria-label={member.name}>
          {member.emoji}
        </span>
        <span className="font-semibold text-foreground truncate">{member.name}</span>
        <span className="text-lg">💩</span>
      </div>

      {/* Right side: count + dots */}
      <div className="flex flex-col items-end gap-1.5">
        {/* Count badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
            +1 Bobník
          </span>
          <span
            className={`text-xl font-bold text-foreground tabular-nums ${
              bumping ? 'animate-count-bump' : ''
            }`}
          >
            {todayCount}
          </span>
        </div>

        {/* 7-day dots */}
        <div className="flex gap-1 items-center">
          {weekDots.map((filled, i) => {
            const isToday = i === weekDots.length - 1;
            return (
              <div
                key={i}
                className={`rounded-full ${
                  filled ? 'bg-dot-filled' : 'bg-dot-empty'
                } ${isToday ? 'w-2.5 h-2.5' : 'w-2 h-2'}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
