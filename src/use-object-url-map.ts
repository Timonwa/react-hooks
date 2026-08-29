/**
 * @description Maintains a map of object URLs for a dynamic list of files —
 * creates a URL when an item first appears, revokes it when the item leaves the
 * list, and revokes everything on unmount. Safe for upload queues / duplicate
 * lists where items are added and removed over time.
 *
 * Pass stable (module-level or memoized) `getId` / `getFile` accessors so the
 * reconciliation effect only re-runs when `items` actually changes.
 *
 * @param items - The current list of items
 * @param getId - Stable unique id for an item (used as the map key)
 * @param getFile - The File to create an object URL for
 * @returns A record of id → object URL
 *
 * @example
 * const getId = (i: QueueItem) => i.id;
 * const getFile = (i: QueueItem) => i.file;
 * const urls = useObjectUrlMap(queue, getId, getFile);
 */

"use client";

import { useEffect, useRef, useState } from "react";

export function useObjectUrlMap<T>(
  items: T[],
  getId: (item: T) => string,
  getFile: (item: T) => File,
): Record<string, string> {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const trackedRef = useRef<Set<string>>(new Set());
  // Mirrors urlMap for the unmount cleanup: a setState updater never runs on an
  // unmounted component, so revoking inside one silently leaks every URL.
  const urlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const activeIds = new Set(items.map(getId));

    // Create URLs for items we haven't seen yet.
    const additions: Record<string, string> = {};
    for (const item of items) {
      const id = getId(item);
      if (!trackedRef.current.has(id)) {
        additions[id] = URL.createObjectURL(getFile(item));
        trackedRef.current.add(id);
      }
    }

    // Mark URLs for items that have left the list.
    const removedIds: string[] = [];
    for (const id of trackedRef.current) {
      if (!activeIds.has(id)) {
        removedIds.push(id);
        trackedRef.current.delete(id);
      }
    }

    if (Object.keys(additions).length === 0 && removedIds.length === 0) return;

    setUrlMap((prev) => {
      const next = { ...prev, ...additions };
      for (const id of removedIds) {
        if (next[id]) URL.revokeObjectURL(next[id]);
        delete next[id];
      }
      urlsRef.current = next;
      return next;
    });
  }, [items, getId, getFile]);

  // Revoke everything on unmount — from the ref, never a setState updater.
  useEffect(() => {
    return () => {
      for (const url of Object.values(urlsRef.current)) URL.revokeObjectURL(url);
      urlsRef.current = {};
    };
  }, []);

  return urlMap;
}
