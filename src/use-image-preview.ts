/**
 * @description Creates a temporary preview URL from a File object.
 * Automatically revokes the URL on cleanup to prevent memory leaks.
 *
 * @param file - The image File to preview, or null
 * @returns The object URL string, or null if no file
 *
 * @example
 * const preview = useImagePreview(coverImageFile);
 * {preview && <img src={preview} />}
 */

"use client";

import { useEffect, useState } from "react";

export function useImagePreview(file: File | null): string | null {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  return preview;
}
