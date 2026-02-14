import { useState, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface FloatingAddButtonProps {
  members: { id: string; name: string; emoji: string }[];
  onAddEvent: (memberId: string) => void;
}

export function FloatingAddButton({ members, onAddEvent }: FloatingAddButtonProps) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const HOLD_MS = 400;

  const startHold = useCallback(() => {
    startRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / HOLD_MS, 1);
      setProgress(p);
      if (p < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    timerRef.current = window.setTimeout(() => {
      setProgress(0);
      setOpen(true);
    }, HOLD_MS);
  }, []);

  const cancelHold = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    timerRef.current = null;
    frameRef.current = null;
    setProgress(0);
  }, []);

  // Interpolate from light beige to darker brown
  const bgColor = `hsl(28 ${50 + progress * 20}% ${85 - progress * 30}%)`;

  return (
    <>
      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onContextMenu={e => e.preventDefault()}
        className="fixed bottom-28 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-shadow duration-300 active:scale-95 select-none"
        style={{
          backgroundColor: bgColor,
          boxShadow: `0 4px 16px hsl(28 70% 48% / ${0.2 + progress * 0.15})`,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        aria-label="Přidat bobník"
      >
        💩
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-4 max-h-[60vh]">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-base font-bold text-foreground">Kdo vysadil šišku?</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  onAddEvent(member.id);
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-row-hover active:bg-row-active transition-colors"
              >
                <span className="text-2xl">{member.emoji}</span>
                <span className="font-semibold text-foreground">{member.name}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
