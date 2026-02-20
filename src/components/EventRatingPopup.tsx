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
  onSave: (ratings: {
    consistency: number;
    smell: number;
    size: number;
    effort: number;
    notary_present: boolean;
    neptunes_touch: boolean;
    phantom_cone: boolean;
  }) => void;
  onSkip: () => void;
  onUndo: () => void;
  canUndo: boolean;
  editValues?: {
    consistency: number;
    smell: number;
    size: number;
    effort: number;
    notary_present: boolean;
    neptunes_touch: boolean;
    phantom_cone: boolean;
  } | null;
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
    <div className="space-y-0.5">
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

function PhenomenonCheckbox({
  checked,
  onChange,
  icon,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-foreground">
          {icon} {title}
        </span>
        <p className="text-[10px] text-muted-foreground/65 leading-tight mt-0.5">{description}</p>
      </div>
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`h-4 w-4 rounded border-border accent-primary transition-transform ${
            checked ? 'scale-105' : 'scale-100'
          }`}
        />
      </div>
    </label>
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
  const [neptunesTouch, setNeptunesTouch] = useState(false);
  const [phantomCone, setPhantomCone] = useState(false);
  const isEditMode = !!editValues;

  useEffect(() => {
    if (editValues) {
      setRatings({
        consistency: editValues.consistency,
        smell: editValues.smell,
        size: editValues.size,
        effort: editValues.effort,
      });
      setNotaryPresent(editValues.notary_present);
      setNeptunesTouch(editValues.neptunes_touch);
      setPhantomCone(editValues.phantom_cone);
    } else {
      setRatings({ consistency: 0, smell: 0, size: 0, effort: 0 });
      setNotaryPresent(false);
      setNeptunesTouch(false);
      setPhantomCone(false);
    }
  }, [editValues]);

  const updateRating = (key: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const resetState = () => {
    setRatings({ consistency: 0, smell: 0, size: 0, effort: 0 });
    setNotaryPresent(false);
    setNeptunesTouch(false);
    setPhantomCone(false);
  };

  const handleSave = () => {
    onSave({
      ...ratings,
      notary_present: notaryPresent,
      neptunes_touch: neptunesTouch,
      phantom_cone: phantomCone,
    });
    resetState();
  };

  const handleSkip = () => {
    resetState();
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleSkip(); }}>
      <DialogContent className="max-w-[360px] rounded-2xl p-5 gap-3 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="text-base font-bold">{isEditMode ? 'Upravit záznam' : 'Detaily záznamu'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditMode ? 'Uprav vlastnosti nebo odeber záznam' : 'Ohodnoť vlastnosti (volitelné)'}
          </DialogDescription>
        </DialogHeader>

        {/* Attribute ratings – compact */}
        <div className="space-y-2.5">
          {ATTRIBUTES.map(attr => (
            <div key={attr.key}>
              <p className="text-xs font-semibold text-foreground mb-1 text-center">{attr.label}</p>
              <SegmentedControl
                value={ratings[attr.key]}
                onChange={(v) => updateRating(attr.key, v)}
                leftLabel={attr.left}
                rightLabel={attr.right}
              />
            </div>
          ))}
        </div>

        {/* Notary checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
          <input
            type="checkbox"
            checked={notaryPresent}
            onChange={(e) => setNotaryPresent(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-xs font-medium text-foreground">Přítomen notář</span>
        </label>
        <p className="text-[10px] text-muted-foreground/60 -mt-2 ml-6">Pro oficiální a historicky doložené záznamy.</p>

        {/* Special Phenomena section */}
        <div className="border-t border-border/40 pt-3 mt-1 space-y-2.5">
          <p className="text-xs font-semibold text-foreground">🌊 Speciální jevy (volitelné)</p>

          <PhenomenonCheckbox
            checked={neptunesTouch}
            onChange={setNeptunesTouch}
            icon="🌊"
            title="Neptune's Touch"
            description="Porcelánový křest vodou."
          />

          <PhenomenonCheckbox
            checked={phantomCone}
            onChange={setPhantomCone}
            icon="👻"
            title="Phantom Cone"
            description="Zmizelo beze svědků."
          />
        </div>

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
