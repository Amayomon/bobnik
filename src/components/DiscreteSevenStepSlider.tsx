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

  const thumbIndex = value + 3;
  // Padding for thumb overflow
  const padPx = 20;

  return (
    <div className="space-y-1.5">
      {/* Labels row */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[8px] pixel-font" style={{ color: '#a08a60' }}>{leftLabel}</span>
        <span className="text-[10px] pixel-font font-bold" style={{ color: '#3a250e' }}>{title}</span>
        <span className="text-[8px] pixel-font" style={{ color: '#a08a60' }}>{rightLabel}</span>
      </div>

      {/* Track wrapper – extra padding so thumb can overflow */}
      <div className="relative" style={{ padding: `0 ${padPx}px` }}>
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
          className={`pixel-track relative h-6 touch-none select-none ${disabled ? '' : 'cursor-pointer'}`}
        >
          {/* Min label */}
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[7px] pixel-font font-bold" style={{ color: '#8a6f44' }}>
            -3
          </div>

          {/* Step dots */}
          <div className="absolute inset-y-0 left-8 right-2 flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`pixel-dot ${i <= thumbIndex ? 'pixel-dot-active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Thumb – positioned over track, vertically centered */}
        <div
          className="pixel-thumb absolute top-1/2 -translate-y-1/2 w-10 h-8 flex items-center justify-center pointer-events-none"
          style={{
            left: `calc(${padPx}px + (100% - ${padPx * 2}px) * ${thumbIndex / 6} - 20px)`,
          }}
        >
          <span className="text-[10px] pixel-font font-bold" style={{ color: '#fff', textShadow: '1px 1px 0 #5a3a1a' }}>
            {value > 0 ? `+${value}` : value}
          </span>
        </div>
      </div>
    </div>
  );
}
