/**
 * @description Creates an object URL for a Blob/File and revokes it on cleanup
 * to prevent memory leaks — the single-item counterpart of `useObjectUrlMap`.
 * The canonical use is previewing a just-picked file before upload.
 *
 * @param blob - The Blob/File to create a URL for, or null
 * @returns The object URL string, or null if no blob
 *
 * @example
 * const previewUrl = useObjectUrl(selectedFile);
 * {previewUrl && <img src={previewUrl} alt="" />}
 */

"use client";

import { useEffect, useState } from "react";

export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setUrl(null);
  }, [blob]);

  return url;
}
