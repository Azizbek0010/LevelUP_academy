import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/** Smoothly counts up (or morphs) to the target value. Uses requestAnimationFrame. */
export function AnimatedNumber({
  value,
  duration = 900,
  format = (n) => Math.round(n).toLocaleString('ru-RU'),
  className,
}: Props): React.ReactElement {
  const [displayed, setDisplayed] = useState(value);
  const start = useRef(value);
  const startAt = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    start.current = displayed;
    startAt.current = null;
    const target = value;
    function step(t: number) {
      if (startAt.current === null) startAt.current = t;
      const elapsed = t - startAt.current;
      const p = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(start.current + (target - start.current) * eased);
      if (p < 1) {
        raf.current = requestAnimationFrame(step);
      }
    }
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{format(displayed)}</span>;
}
