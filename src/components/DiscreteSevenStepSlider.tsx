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

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px] px-0.5">
        <span className="text-muted-foreground">{leftLabel}</span>
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="text-muted-foreground">{rightLabel}</span>
      </div>
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
        className={`flex gap-0.5 touch-none select-none ${disabled ? '' : 'cursor-pointer'}`}
      >
        {STEPS.map(step => {
          const isSelected = value === step;
          const isCenter = step === 0;
          return (
            <div
              key={step}
              className={`
                flex-1 py-1.5 text-xs font-medium rounded-md text-center transition-all pointer-events-none
                ${isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isCenter
                    ? 'bg-muted/80 text-foreground'
                    : 'bg-muted/40 text-muted-foreground'
                }
              `}
            >
              {step > 0 ? `+${step}` : step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
