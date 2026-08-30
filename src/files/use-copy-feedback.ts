/**
 * @description Clipboard write plus the transient "Copied" state that follows.
 */

"use client";

import { copyTextToClipboard } from "@timonwa/app-utilities/browser";
import { useState } from "react";

const SINGLE = "single";

/**
 * Clipboard write plus the transient "Copied" state every copy button repeats.
 * Keyed rather than boolean so a list can show feedback on the one row that was
 * copied; callers with a single button ignore the key. Returns whether the
 * write succeeded rather than handling failure itself — the clipboard is
 * blocked in insecure contexts, and each caller words that differently.
 *
 * @example const { copy, isCopied } = useCopyFeedback(); await copy(inviteUrl);
 */
export function useCopyFeedback(feedbackMs = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copy(text: string, key: string = SINGLE): Promise<boolean> {
    const succeeded = await copyTextToClipboard(text);
    if (!succeeded) return false;
    setCopiedKey(key);
    // Only clear if this key is still the current one — a second copy
    // elsewhere shouldn't have its feedback cut short by the first timer.
    setTimeout(
      () => setCopiedKey((current) => (current === key ? null : current)),
      feedbackMs,
    );
    return true;
  }

  return {
    copiedKey,
    /** True when the given key (or the single unkeyed target) was just copied. */
    isCopied: (key: string = SINGLE) => copiedKey === key,
    copy,
  };
}
