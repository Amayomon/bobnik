import { useState, useEffect } from 'react';
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
    consistency: 0, smell: 0, size: 0, effort: 0,
  });
  const [notaryPresent, setNotaryPresent] = useState(false);
  const [neptunesTouch, setNeptunesTouch] = useState(false);
  const [phantomCone, setPhantomCone] = useState(false);

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

  if (!open) return null;

  const titleText = mode === 'view' ? 'Detail záznamu' : mode === 'edit' ? 'Upravit záznam' : 'Detaily záznamu';

  return (
    <>
      {/* Overlay – solid dark, no blur */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(30, 20, 10, 0.65)' }}
        onClick={handleSkip}
      />

      {/* Pixel card modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pixel-card relative w-full max-w-[360px] p-5 pointer-events-auto max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm pixel-font font-bold" style={{ color: '#3a250e' }}>
              {titleText}
            </h2>
            <button
              onClick={handleSkip}
              className="text-lg pixel-font leading-none hover:opacity-70"
              style={{ color: '#5a3a1a' }}
              aria-label="Zavřít"
            >
              ✕
            </button>
          </div>

          {/* Attribute sliders */}
          <div className="space-y-3">
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
          <label className={`flex items-center gap-3 mt-4 select-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] pixel-font font-bold" style={{ color: '#3a250e' }}>
                Přítomen notář ❤️
              </span>
              <p className="text-[8px] pixel-font mt-0.5" style={{ color: '#8a6f44' }}>
                Pro oficiální a historicky doložené záznamy.
              </p>
            </div>
            <input
              type="checkbox"
              checked={notaryPresent}
              disabled={isReadOnly}
              onChange={(e) => { if (!isReadOnly) setNotaryPresent(e.target.checked); }}
              className="pixel-checkbox"
            />
          </label>

          {/* Special Phenomena section */}
          <div className="pixel-section p-3 mt-3 space-y-2.5">
            <div>
              <p className="text-[10px] pixel-font font-bold" style={{ color: '#3a250e' }}>
                Speciální jevy (volitelné)
              </p>
            </div>

            <label className={`flex items-center gap-3 select-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] pixel-font font-bold" style={{ color: '#3a250e' }}>
                  Neptunův dotek
                </span>
                <p className="text-[7px] pixel-font mt-0.5" style={{ color: '#8a6f44' }}>
                  Porcelánový křest vodou.
                </p>
              </div>
              <input
                type="checkbox"
                checked={neptunesTouch}
                disabled={isReadOnly}
                onChange={(e) => { if (!isReadOnly) setNeptunesTouch(e.target.checked); }}
                className="pixel-checkbox"
              />
            </label>

            <label className={`flex items-center gap-3 select-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] pixel-font font-bold" style={{ color: '#3a250e' }}>
                  Fantomská šiška
                </span>
                <p className="text-[7px] pixel-font mt-0.5" style={{ color: '#8a6f44' }}>
                  Zmizela beze svědků.
                </p>
              </div>
              <input
                type="checkbox"
                checked={phantomCone}
                disabled={isReadOnly}
                onChange={(e) => { if (!isReadOnly) setPhantomCone(e.target.checked); }}
                className="pixel-checkbox"
              />
            </label>
          </div>

          {/* Action buttons */}
          {isReadOnly ? (
            <div className="mt-4">
              <button
                onClick={handleSkip}
                className="pixel-btn-skip w-full py-2.5 text-[10px] pixel-font font-bold"
              >
                Zavřít
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  className="pixel-btn-save flex-1 py-2.5 text-[10px] pixel-font font-bold"
                >
                  Uložit
                </button>
                <button
                  onClick={handleSkip}
                  className="pixel-btn-skip flex-1 py-2.5 text-[10px] pixel-font font-bold"
                >
                  Přeskočit
                </button>
              </div>
              {canUndo && mode === 'create' && (
                <button
                  onClick={onUndo}
                  className="w-full text-[8px] pixel-font font-bold py-2 mt-2 hover:opacity-70"
                  style={{ color: '#a03030' }}
                >
                  ↩ Zpět (smazat záznam)
                </button>
              )}
              {mode === 'edit' && onDelete && (
                <button
                  onClick={onDelete}
                  className="w-full text-[8px] pixel-font font-bold py-2 mt-2 hover:opacity-70"
                  style={{ color: '#a03030' }}
                >
                  🗑 Odebrat záznam
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
