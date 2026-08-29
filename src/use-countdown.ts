/**
 * @description Ticks once per second from `durationSeconds` down to 0. Call
 * `start()` to (re)kick the countdown.
 *
 * @param durationSeconds - How long the countdown runs for each `start()` call
 * @returns `{ remaining, formatted, isActive, start }` — remaining seconds, "M:SS" string, active flag, and start function
 *
 * @example
 * const { formatted, isActive, start } = useCountdown(60);
 * <button onClick={start} disabled={isActive}>
 *   {isActive ? `Resend in ${formatted}` : "Resend code"}
 * </button>
 */

"use client";

import { useCallback, useEffect, useState } from "react";

export function useCountdown(durationSeconds: number) {
  const [remaining, setRemaining] = useState(0);

  const isActive = remaining > 0;

  const start = useCallback(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { remaining, formatted, isActive, start };
}
