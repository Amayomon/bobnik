import { useState } from 'react';

interface MemberRowProps {
  member: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    aura_type?: string | null;
  };
  todayCount: number;
  weekDots: boolean[];
  onTap: () => void;
}

function getMicroTitle(count: number): string {
  if (count === 0) return 'Tichý pozorovatel';
  if (count === 1) return 'Kosmická šlupka';
  if (count === 2) return 'Dvojitý portál';
  if (count === 3) return 'Polní dělostřelectvo';
  return 'Obléhací specialista';
}

function getPillTint(count: number): string {
  if (count >= 4) return 'bg-primary/12';
  if (count >= 3) return 'bg-primary/10';
  return 'bg-primary/8';
}

export function MemberRow({
  member,
  todayCount,
  weekDots,
  onTap
}: MemberRowProps) {
  const [bumping, setBumping] = useState(false);

  const aura = member.aura_type;
  const auraClass = aura === 'angelic'
    ? 'ring-2 ring-[hsl(45_70%_55%)] shadow-[0_0_12px_hsl(45_70%_55%/0.12)] animate-aura-shimmer'
    : aura === 'demonic'
      ? 'ring-2 ring-[hsl(0_50%_40%)] animate-aura-pulse'
      : '';

  return (
    <div
      onClick={onTap}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer select-none transition-colors duration-150 hover:bg-row-hover ${auraClass}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-2xl" role="img">{member.emoji}</span>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-foreground truncate flex items-center gap-1">
            {member.name}
            {aura === 'angelic' && <span className="text-xs opacity-70">😇</span>}
            {aura === 'demonic' && <span className="text-xs opacity-70">😈</span>}
          </span>
          <span className="text-xs text-muted-foreground/70 truncate">{getMicroTitle(todayCount)}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <div className={`flex items-center rounded-full px-3 py-1 gap-0 ${getPillTint(todayCount)} transition-all duration-300 ${bumping ? 'scale-105' : 'scale-100'}`}>
          <span className="text-[11px] font-medium text-muted-foreground">Denní úroda</span>
          <span className="mx-1.5 w-px h-3 bg-muted-foreground/20" />
          <span className={`text-[13px] font-semibold text-foreground tabular-nums leading-none transition-transform duration-300 ${bumping ? 'animate-count-bump' : ''}`}>
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
