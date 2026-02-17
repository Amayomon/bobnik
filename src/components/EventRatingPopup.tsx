import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface EventRatingPopupProps {
  open: boolean;
  onSave: (ratings: { consistency: number; smell: number; size: number; effort: number; notary_present: boolean }) => void;
  onSkip: () => void;
  onUndo: () => void;
  canUndo: boolean;
  /** When editing an existing event, pre-fill values */
  editValues?: { consistency: number; smell: number; size: number; effort: number; notary_present: boolean } | null;
  /** Show delete button in edit mode */
  onDelete?: () => void;
}

const ATTRIBUTES = [
  { key: 'consistency' as const, label: 'Konzistence', left: 'Řídké', right: 'Tuhé' },
  { key: 'smell' as const, label: 'Zápach', left: 'Slabé', right: 'Silné' },
  { key: 'size' as const, label: 'Velikost', left: 'Malé', right: 'Velké' },
  { key: 'effort' as const, label: 'Úsilí', left: 'Snadné', right: 'Náročné' },
] as const;

const STEPS = [-3, -2, -1, 0, 1, 2, 3];

function SegmentedControl({
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="flex gap-0.5">
        {STEPS.map(step => {
          const isSelected = value === step;
          const isCenter = step === 0;
          return (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              className={`
                flex-1 py-1.5 text-xs font-medium rounded-md transition-all
                ${isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isCenter
                    ? 'bg-muted/80 text-foreground hover:bg-muted'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                }
              `}
            >
              {step > 0 ? `+${step}` : step}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EventRatingPopup({ open, onSave, onSkip, onUndo, canUndo, editValues, onDelete }: EventRatingPopupProps) {
  const [ratings, setRatings] = useState({
    consistency: 0,
    smell: 0,
    size: 0,
    effort: 0,
  });
  const [notaryPresent, setNotaryPresent] = useState(false);
  const isEditMode = !!editValues;

  // Pre-fill values when editing
  useEffect(() => {
    if (editValues) {
      setRatings({
        consistency: editValues.consistency,
        smell: editValues.smell,
        size: editValues.size,
        effort: editValues.effort,
      });
      setNotaryPresent(editValues.notary_present);
    } else {
      setRatings({ consistency: 0, smell: 0, size: 0, effort: 0 });
      setNotaryPresent(false);
    }
  }, [editValues]);

  const updateRating = (key: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({ ...ratings, notary_present: notaryPresent });
    setRatings({ consistency: 0, smell: 0, size: 0, effort: 0 });
    setNotaryPresent(false);
  };

  const handleSkip = () => {
    setRatings({ consistency: 0, smell: 0, size: 0, effort: 0 });
    setNotaryPresent(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleSkip(); }}>
      <DialogContent className="max-w-[360px] rounded-2xl p-5 gap-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold">{isEditMode ? 'Upravit záznam' : 'Detaily záznamu'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditMode ? 'Uprav vlastnosti nebo odeber záznam' : 'Ohodnoť vlastnosti (volitelné)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {ATTRIBUTES.map(attr => (
            <div key={attr.key}>
              <p className="text-xs font-semibold text-foreground mb-1.5">{attr.label}</p>
              <SegmentedControl
                value={ratings[attr.key]}
                onChange={(v) => updateRating(attr.key, v)}
                leftLabel={attr.left}
                rightLabel={attr.right}
              />
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notaryPresent}
            onChange={(e) => setNotaryPresent(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-xs font-medium text-foreground">Přítomen notář</span>
        </label>
        <p className="text-[10px] text-muted-foreground/60 -mt-2 ml-6">Pro oficiální a historicky doložené záznamy.</p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Uložit
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 bg-muted text-muted-foreground text-sm font-semibold py-2 rounded-xl hover:bg-muted/80 transition-colors"
          >
            Přeskočit
          </button>
        </div>
        {canUndo && !isEditMode && (
          <button
            onClick={onUndo}
            className="w-full text-xs text-destructive font-medium py-1.5 hover:underline transition-colors"
          >
            ↩ Zpět (smazat záznam)
          </button>
        )}
        {isEditMode && onDelete && (
          <button
            onClick={onDelete}
            className="w-full text-xs text-destructive font-medium py-1.5 hover:underline transition-colors"
          >
            🗑 Odebrat záznam
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
