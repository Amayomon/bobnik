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
    <div className="space-y-0">
      {/* Title centered */}
      <p className="text-xs font-bold text-foreground text-center mb-0.5">{title}</p>

      {/* Slider track */}
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
        className={`relative h-8 touch-none select-none ${disabled ? '' : 'cursor-pointer'}`}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-muted/60 rounded-full mx-4" />

        {/* Dots & thumb */}
        <div className="absolute inset-x-4 top-0 bottom-0">
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
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md"
                    style={{ boxShadow: '0 2px 8px hsl(var(--primary) / 0.35)' }}
                  >
                    <span className="text-xs font-bold text-primary-foreground">{value}</span>
                  </div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/25" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels below */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5 -mt-0.5">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
