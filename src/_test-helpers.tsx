// Shared test fakes — imported by the colocated test files, never exported
// from any barrel and never built into dist.
import { vi } from "vitest";

export function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(e: { matches: boolean }) => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
  }));
  return {
    listeners,
    /** Flip what the query reports and notify every subscribed listener. */
    setMatches(next: boolean) {
      matches = next;
      for (const cb of listeners) cb({ matches: next });
    },
  };
}

// jsdom has no URL.createObjectURL/revokeObjectURL; the object-URL hooks need
// deterministic, observable fakes. Created URLs count up from "blob:0"; the
// returned array records revocations in order.
export function mockObjectUrls() {
  const revoked: string[] = [];
  let counter = 0;
  URL.createObjectURL = vi.fn(() => `blob:${counter++}`);
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url);
  });
  return revoked;
}

// jsdom has no requestAnimationFrame; several hooks defer one frame through it.
export function stubImmediateRaf() {
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  };
  window.cancelAnimationFrame = () => {};
}
