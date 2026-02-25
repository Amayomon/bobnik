import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import bobnikImg from '@/assets/bobnik.png';
import studankaImg from '@/assets/bobnikova-studanka.png';
import exorcismusImg from '@/assets/kadnikovy-exorcismus.png';

interface StonePedestalsProps {
  myMemberId: string | null;
  onAddEvent: (memberId: string) => Promise<string | null | void>;
}

export function StonePedestals({ myMemberId, onAddEvent }: StonePedestalsProps) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const triggeredRef = useRef(false);
  const HOLD_MS = 800;

  const triggerAction = useCallback(async () => {
    if (!myMemberId) return;
    triggeredRef.current = true;
    if (navigator.vibrate) navigator.vibrate(30);
    await onAddEvent(myMemberId);
    toast('Zapsáno.', { duration: 2000 });
    setProgress(0);
  }, [myMemberId, onAddEvent]);

  const startHold = useCallback(() => {
    triggeredRef.current = false;
    startRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / HOLD_MS, 1);
      setProgress(p);
      if (p >= 1 && !triggeredRef.current) {
        triggerAction();
        return;
      }
      if (p < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
  }, [triggerAction]);

  const cancelHold = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    if (!triggeredRef.current) {
      setProgress(0);
    }
  }, []);

  return (
    <div className="flex items-end justify-center gap-3 px-4 py-3">
      {/* Left – Bobníková studánka */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full opacity-30 blur-md"
            style={{ background: 'radial-gradient(circle, hsl(190 70% 60% / 0.5), transparent 70%)' }}
          />
          <img
            src={studankaImg}
            alt="Bobníková studánka"
            className="relative z-10 w-full h-full object-contain drop-shadow-lg"
            draggable={false}
          />
        </div>
        <span className="text-[9px] text-muted-foreground font-semibold text-center leading-tight">Bobníková<br/>studánka</span>
      </div>

      {/* Center – Bobník (main action, slightly larger) */}
      <div className="flex flex-col items-center gap-1 -mt-2">
        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onContextMenu={e => e.preventDefault()}
          className="relative w-24 h-24 flex items-center justify-center select-none"
          aria-label="Přidat bobník"
        >
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="hsl(28 55% 42% / 0.3)"
              strokeWidth="4"
            />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="hsl(28 55% 42%)"
              strokeWidth="4"
              strokeDasharray={`${progress * 276.46} 276.46`}
              strokeLinecap="round"
              className="transition-none"
            />
          </svg>
          <img
            src={bobnikImg}
            alt="Bobník"
            className="relative z-10 w-full h-full object-contain drop-shadow-lg"
            style={{
              animation: progress > 0 && progress < 1 ? 'fab-breathe 1.5s ease-in-out infinite' : 'none',
            }}
            draggable={false}
          />
        </button>
        <span className="text-[9px] text-muted-foreground font-semibold">Bobník</span>
      </div>

      {/* Right – Kadníkový exorcismus */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full opacity-30 blur-md"
            style={{ background: 'radial-gradient(circle, hsl(270 60% 55% / 0.5), transparent 70%)' }}
          />
          <img
            src={exorcismusImg}
            alt="Kadníkový exorcismus"
            className="relative z-10 w-full h-full object-contain drop-shadow-lg"
            draggable={false}
          />
        </div>
        <span className="text-[9px] text-muted-foreground font-semibold text-center leading-tight">Kadníkový<br/>exorcismus</span>
      </div>
    </div>
  );
}
