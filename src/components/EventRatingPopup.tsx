import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DiscreteSevenStepSlider } from '@/components/DiscreteSevenStepSlider';

type EventRatingMode = 'create' | 'edit' | 'view';

interface EventRatingPopupProps {
  open: boolean;
  mode?: EventRatingMode;
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

export function EventRatingPopup({ open, mode: modeProp, onSave, onSkip, onUndo, canUndo, editValues, onDelete }: EventRatingPopupProps) {
  const mode: EventRatingMode = modeProp ?? (editValues ? 'edit' : 'create');
  const isReadOnly = mode === 'view';
  const [ratings, setRatings] = useState({
    consistency: 0,
    smell: 0,
    size: 0,
    effort: 0,
  });
  const [notaryPresent, setNotaryPresent] = useState(false);
  const [neptunesTouch, setNeptunesTouch] = useState(false);
  const [phantomCone, setPhantomCone] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    if (isReadOnly) return;
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const resetState = () => {
    setRatings({ consistency: 0, smell: 0, size: 0, effort: 0 });
    setNotaryPresent(false);
    setNeptunesTouch(false);
    setPhantomCone(false);
  };

  const handleSave = () => {
    if (isReadOnly) return;
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
      <DialogContent
        className="max-w-[360px] rounded-2xl gap-0 max-h-[85vh] overflow-y-auto"
        style={{ padding: '12px 14px 14px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <DialogHeader className="space-y-0" style={{ marginBottom: '6px' }}>
          <DialogTitle className="text-sm font-bold">{mode === 'view' ? 'Detail záznamu' : mode === 'edit' ? 'Upravit záznam' : 'Detaily záznamu'}</DialogTitle>
        </DialogHeader>

        {/* Attribute ratings */}
        <div className="flex flex-col" style={{ gap: '6px' }}>
          {ATTRIBUTES.map(attr => (
            <DiscreteSevenStepSlider
              key={attr.key}
              value={ratings[attr.key]}
              onChange={(v) => updateRating(attr.key, v)}
              leftLabel={attr.left}
              rightLabel={attr.right}
              title={attr.label}
              disabled={isReadOnly}
            />
          ))}
        </div>

        {/* Notary checkbox */}
        <label className={`flex items-center gap-2 select-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`} style={{ marginTop: '10px' }}>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-medium text-foreground">Přítomen notář</span>
            <p className="text-[9px] text-muted-foreground/60 leading-tight">Pro oficiální záznamy.</p>
          </div>
          <input
            type="checkbox"
            checked={notaryPresent}
            disabled={isReadOnly}
            onChange={(e) => { if (!isReadOnly) setNotaryPresent(e.target.checked); }}
            className={`h-3.5 w-3.5 rounded border-border accent-primary transition-transform ${notaryPresent ? 'scale-105' : 'scale-100'}`}
          />
        </label>

        {/* Special Phenomena section */}
        <div
          className="bg-muted/20 rounded-lg"
          style={{ marginTop: '8px', padding: '8px 10px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <p className="text-[11px] font-semibold text-foreground" style={{ marginBottom: '6px' }}>Speciální jevy</p>

          <div className="flex flex-col" style={{ gap: '6px' }}>
            <label className={`flex items-center gap-2 select-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-foreground">Neptunův dotek</span>
                <p className="text-[9px] text-muted-foreground/65 leading-tight">Porcelánový křest vodou.</p>
              </div>
              <input
                type="checkbox"
                checked={neptunesTouch}
                disabled={isReadOnly}
                onChange={(e) => { if (!isReadOnly) setNeptunesTouch(e.target.checked); }}
                className={`h-3.5 w-3.5 rounded border-border accent-primary transition-transform ${neptunesTouch ? 'scale-105' : 'scale-100'}`}
              />
            </label>

            <label className={`flex items-center gap-2 select-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-foreground">Fantomská šiška</span>
                <p className="text-[9px] text-muted-foreground/65 leading-tight">Zmizela beze svědků.</p>
              </div>
              <input
                type="checkbox"
                checked={phantomCone}
                disabled={isReadOnly}
                onChange={(e) => { if (!isReadOnly) setPhantomCone(e.target.checked); }}
                className={`h-3.5 w-3.5 rounded border-border accent-primary transition-transform ${phantomCone ? 'scale-105' : 'scale-100'}`}
              />
            </label>
          </div>
        </div>

        {/* Action buttons */}
        {isReadOnly ? (
          <div style={{ paddingTop: '8px' }} className="space-y-1">
            <button
              onClick={handleSkip}
              className="w-full bg-muted text-muted-foreground text-xs font-semibold py-1.5 rounded-xl hover:bg-muted/80 transition-colors"
            >
              Zavřít
            </button>
            {onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-[11px] text-destructive font-medium py-0.5 hover:underline transition-colors"
              >
                🗑 Smazat záznam
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex gap-2" style={{ paddingTop: '8px' }}>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Uložit
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 bg-muted text-muted-foreground text-xs font-semibold py-1.5 rounded-xl hover:bg-muted/80 transition-colors"
              >
                Přeskočit
              </button>
            </div>
            {canUndo && mode === 'create' && (
              <button
                onClick={onUndo}
                className="w-full text-[11px] text-destructive font-medium py-0.5 hover:underline transition-colors"
              >
                ↩ Zpět (smazat záznam)
              </button>
            )}
            {mode === 'edit' && onDelete && (
              <button
                onClick={onDelete}
                className="w-full text-[11px] text-destructive font-medium py-0.5 hover:underline transition-colors"
              >
                🗑 Odebrat záznam
              </button>
            )}
          </>
        )}
      </DialogContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat záznam?</AlertDialogTitle>
            <AlertDialogDescription>Tuto akci nelze vrátit zpět.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmDelete(false);
                onDelete?.();
              }}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
