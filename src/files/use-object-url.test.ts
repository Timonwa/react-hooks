import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockObjectUrls } from "../_test-helpers.js";
import { useObjectUrl } from "../index.js";

const makeFile = (name: string) => new File(["x"], name, { type: "image/png" });

describe("useObjectUrl", () => {
  it("creates a URL for the blob and revokes it when the blob changes", () => {
    const revoked: string[] = [];
    let counter = 0;
    URL.createObjectURL = vi.fn(() => `blob:${counter++}`);
    URL.revokeObjectURL = vi.fn((u: string) => revoked.push(u));

    const file = new File(["x"], "x.png", { type: "image/png" });
    const { result, rerender } = renderHook(({ blob }) => useObjectUrl(blob), {
      initialProps: { blob: file as Blob | null },
    });
    expect(result.current).toBe("blob:0");

    rerender({ blob: null });
    expect(result.current).toBe(null);
    expect(revoked).toContain("blob:0");
  });

  it("returns null and creates nothing for a null blob", () => {
    mockObjectUrls();
    const { result } = renderHook(() => useObjectUrl(null));
    expect(result.current).toBe(null);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("swaps to a fresh URL when the blob changes, revoking the old one", () => {
    const revoked = mockObjectUrls();
    const { result, rerender } = renderHook(({ blob }) => useObjectUrl(blob), {
      initialProps: { blob: makeFile("a.png") as Blob | null },
    });
    expect(result.current).toBe("blob:0");

    rerender({ blob: makeFile("b.png") });
    expect(result.current).toBe("blob:1");
    expect(revoked).toEqual(["blob:0"]);
  });

  it("revokes the URL on unmount", () => {
    const revoked = mockObjectUrls();
    const file = makeFile("x.png");
    const { unmount } = renderHook(() => useObjectUrl(file));
    expect(revoked).toEqual([]);
    unmount();
    expect(revoked).toEqual(["blob:0"]);
  });
});
