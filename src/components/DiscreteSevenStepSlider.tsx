import { useRef, useCallback } from 'react';

const STEPS = [-3, -2, -1, 0, 1, 2, 3];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface DiscreteSevenStepSliderProps {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
  title: string;
  disabled?: boolean;
}

export function DiscreteSevenStepSlider({
  value,
  onChange,
  leftLabel,
  rightLabel,
  title,
  disabled,
}: DiscreteSevenStepSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const valueFromPointer = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const index = Math.round(ratio * 6);
    return index - 3;
  }, [value]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onChange(valueFromPointer(e.clientX));
  }, [disabled, onChange, valueFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    if (!(e.target as HTMLElement).hasPointerCapture(e.pointerId)) return;
    onChange(valueFromPointer(e.clientX));
  }, [disabled, onChange, valueFromPointer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    let next = value;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': next = clamp(value + 1, -3, 3); break;
      case 'ArrowLeft': case 'ArrowDown': next = clamp(value - 1, -3, 3); break;
      case 'Home': next = -3; break;
      case 'End': next = 3; break;
      default: return;
    }
    e.preventDefault();
    onChange(next);
  }, [disabled, onChange, value]);

  const thumbIndex = value + 3; // 0-6

  return (
    <div>
      {/* Row: leftLabel – title – rightLabel */}
      <div className="flex items-center justify-between px-0.5" style={{ marginBottom: '2px' }}>
        <span className="text-[9px] text-muted-foreground/50 w-12 text-left">{leftLabel}</span>
        <span className="text-[11px] font-semibold text-foreground">{title}</span>
        <span className="text-[9px] text-muted-foreground/50 w-12 text-right">{rightLabel}</span>
      </div>

      {/* Slider track – 44px tall touch target, visual centered */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={-3}
        aria-valuemax={3}
        aria-valuenow={value}
        aria-label={title}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        className={`relative h-9 touch-none select-none ${disabled ? '' : 'cursor-pointer'}`}
      >
        {/* Track – soft inset */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full mx-3"
          style={{
            background: 'hsl(var(--muted) / 0.45)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
          }}
        />

        {/* Active segment tint */}
        {(() => {
          const centerPct = 50;
          const thumbPct = (thumbIndex / 6) * 100;
          const left = Math.min(centerPct, thumbPct);
          const width = Math.abs(thumbPct - centerPct);
          if (width === 0) return null;
          return (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full mx-3"
              style={{
                left: `calc(${left}% * (100% - 24px) / 100 + 12px)`,
                width: `calc(${width}% * (100% - 24px) / 100)`,
                background: 'hsl(var(--primary) / 0.18)',
              }}
            />
          );
        })()}

        {/* Dots & thumb */}
        <div className="absolute inset-x-3 top-0 bottom-0">
          {STEPS.map((step, i) => {
            const isActive = i === thumbIndex;
            const pct = (i / 6) * 100;
            return (
              <div
                key={step}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                style={{ left: `${pct}%` }}
              >
                {isActive ? (
                  <div
                    className="h-6 min-w-[2.5rem] px-2 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.92), hsl(var(--primary)))',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
                    }}
                  >
                    <span className="text-[11px] font-bold text-primary-foreground drop-shadow-sm">{value}</span>
                  </div>
                ) : (
                  <div
                    className="w-[4px] h-[4px] rounded-full"
                    style={{ background: 'hsl(var(--muted-foreground) / 0.18)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
