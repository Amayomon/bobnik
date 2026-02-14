import { useState } from 'react';
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-5 z-40 w-14 h-14 rounded-full bg-primary shadow-[0_4px_16px_hsl(var(--primary)/0.35)] flex items-center justify-center text-2xl active:scale-95 transition-transform hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)]"
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
