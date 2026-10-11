import { useCallback, useEffect, useState } from "react";

const TICK_MS = 1000;

interface Cooldown {
  secondsLeft: number;
  active: boolean;
  start: (seconds: number) => void;
}

export function useCooldown(): Cooldown {
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(Date.now);

  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / TICK_MS));
  const active = secondsLeft > 0;

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [active]);

  const start = useCallback((seconds: number) => {
    const current = Date.now();
    setNow(current);
    setDeadline(current + seconds * TICK_MS);
  }, []);

  return { secondsLeft, active, start };
}
