/**
 * @description Debounce a fast-changing value.
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms have
 * elapsed without `value` changing again — for throttling expensive work driven
 * by fast-changing input, like firing a search request as the user types.
 *
 * @example const debouncedQuery = useDebouncedValue(query, 300);
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
