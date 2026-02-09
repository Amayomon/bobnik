import { useEffect, useState } from 'react';
import { Member, BobnikEvent } from '@/hooks/useBobnikStore';

interface UndoToastProps {
  event: BobnikEvent;
  member: Member | undefined;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ event, member, onUndo, onDismiss }: UndoToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-undo text-undo-foreground rounded-full shadow-lg">
        <span className="text-sm">
          💩 +1 pro {member?.name ?? '?'}
        </span>
        <button
          onClick={onUndo}
          className="text-sm font-bold text-primary underline underline-offset-2"
        >
          Zpět
        </button>
        <div className="w-12 h-1 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-progress-fill" />
        </div>
      </div>
    </div>
  );
}
