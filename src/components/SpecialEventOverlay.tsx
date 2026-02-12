import { useEffect, useState } from 'react';

type SpecialType = 'angelic' | 'demonic';

interface SpecialEventOverlayProps {
  type: SpecialType;
  onDone: () => void;
}

export function SpecialEventOverlay({ type, onDone }: SpecialEventOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const isAngelic = type === 'angelic';

  return (
    <div
      className={`fixed inset-0 z-[100] pointer-events-none flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Screen tint */}
      <div
        className={`absolute inset-0 ${
          isAngelic
            ? 'bg-[hsl(45_80%_60%/0.12)]'
            : 'bg-[hsl(0_60%_40%/0.1)]'
        } ${!isAngelic ? 'animate-special-shake' : 'animate-special-glow'}`}
      />

      {/* Central toast */}
      <div
        className={`relative z-10 px-8 py-5 rounded-2xl backdrop-blur-md text-center animate-special-enter ${
          isAngelic
            ? 'bg-[hsl(45_60%_95%/0.95)] shadow-[0_0_40px_hsl(45_70%_60%/0.3)]'
            : 'bg-[hsl(0_30%_15%/0.92)] shadow-[0_0_40px_hsl(0_50%_30%/0.3)]'
        }`}
      >
        <div className="text-3xl mb-1">
          {isAngelic ? '✨' : '🔥'}
        </div>
        <h2
          className={`text-lg font-bold mb-0.5 ${
            isAngelic ? 'text-[hsl(35_60%_30%)]' : 'text-[hsl(0_50%_80%)]'
          }`}
        >
          {isAngelic ? 'Andělská šiška' : 'Ďábelská šiška'}
        </h2>
        <p
          className={`text-sm ${
            isAngelic ? 'text-[hsl(35_40%_40%)]' : 'text-[hsl(0_30%_65%)]'
          }`}
        >
          {isAngelic ? 'Nebesa souhlasí.' : 'Podsvětí zaznamenalo.'}
        </p>
        <div className="text-xl mt-1">
          {isAngelic ? '✨' : '🔥'}
        </div>
      </div>

      {/* Floating particles for angelic */}
      {isAngelic && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[hsl(45_80%_65%)] animate-special-particle"
              style={{
                left: `${15 + i * 14}%`,
                animationDelay: `${i * 0.15}s`,
                bottom: '30%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function determineSpecialType(ratings: {
  consistency: number;
  smell: number;
  size: number;
  effort: number;
}): SpecialType | null {
  const values = [ratings.consistency, ratings.smell, ratings.size, ratings.effort];
  const positive = values.filter(v => v > 0).length;
  const negative = values.filter(v => v < 0).length;

  let candidate: SpecialType | null = null;
  if (positive > negative && positive >= 2) candidate = 'angelic';
  else if (negative > positive && negative >= 2) candidate = 'demonic';

  if (!candidate) return null;

  // 25% chance
  const roll = crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1);
  return roll < 0.25 ? candidate : null;
}
