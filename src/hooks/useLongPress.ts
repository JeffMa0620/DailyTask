import { useRef } from 'react';

export function useLongPress(onLongPress: () => void, delay = 900) {
  const timer = useRef<number | undefined>(undefined);

  const start = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(onLongPress, delay);
  };

  const stop = () => {
    window.clearTimeout(timer.current);
  };

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
