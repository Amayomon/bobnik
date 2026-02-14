import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface FloatingAddButtonProps {
  myMemberId: string | null;
  onAddEvent: (memberId: string) => Promise<string | null | void>;
}

export function FloatingAddButton({ myMemberId, onAddEvent }: FloatingAddButtonProps) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const triggeredRef = useRef(false);
  const HOLD_MS = 800;

  const triggerAction = useCallback(async () => {
    if (!myMemberId) return;
    triggeredRef.current = true;
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
    const result = await onAddEvent(myMemberId);
    if (result !== null && result !== undefined) {
      toast('Zapsáno.', { duration: 2000 });
    } else {
      toast('Zapsáno.', { duration: 2000 });
    }
    // Smooth reset
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

  const fillHeight = `${progress * 100}%`;

  return (
    <button
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={e => e.preventDefault()}
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-16 h-16 rounded-full flex items-center justify-center text-2xl select-none overflow-hidden"
      style={{
        backgroundColor: 'hsl(28 50% 85%)',
        boxShadow: `0 4px 16px hsl(28 70% 48% / ${0.15 + progress * 0.2})`,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      aria-label="Přidat bobník"
    >
      {/* Fill overlay from bottom to top */}
      <span
        className="absolute bottom-0 left-0 w-full rounded-full transition-none pointer-events-none"
        style={{
          height: fillHeight,
          backgroundColor: 'hsl(28 55% 42%)',
          transition: progress === 0 ? 'height 0.25s ease-out' : 'none',
        }}
      />
      <span className="relative z-10 text-2xl" style={{
        animation: progress > 0 && progress < 1 ? 'fab-breathe 1.5s ease-in-out infinite' : 'none',
      }}>💩</span>
    </button>
  );
}
