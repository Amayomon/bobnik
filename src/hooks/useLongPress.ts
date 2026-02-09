import { useRef, useCallback, useState } from 'react';

interface UseLongPressOptions {
  threshold?: number;
  onLongPress: () => void;
  onShortPress?: () => void;
}

export function useLongPress({ threshold = 500, onLongPress, onShortPress }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const [pressing, setPressing] = useState(false);

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to avoid text selection on long press
    if ('touches' in e) {
      // Don't prevent default on touchstart to allow scrolling
    }
    isLongPressRef.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setPressing(false);
      onLongPress();
    }, threshold);
  }, [threshold, onLongPress]);

  const cancel = useCallback(() => {
    setPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    cancel();
    if (!isLongPressRef.current && onShortPress) {
      onShortPress();
    }
  }, [cancel, onShortPress]);

  return {
    pressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: end,
      onTouchCancel: cancel,
    },
  };
}
