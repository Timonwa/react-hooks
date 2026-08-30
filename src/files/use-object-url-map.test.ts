import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockObjectUrls } from "../_test-helpers.js";
import { useObjectUrlMap } from "../index.js";

// Stable accessors, as the hook's contract requires.
interface Item {
  id: string;
  file: File;
}
const getId = (item: Item) => item.id;
const getFile = (item: Item) => item.file;
const makeItem = (id: string): Item => ({
  id,
  file: new File(["x"], `${id}.png`, { type: "image/png" }),
});

describe("useObjectUrlMap", () => {
  it("creates one URL per keyed file and revokes on unmount", () => {
    const created: string[] = [];
    const revoked: string[] = [];
    URL.createObjectURL = vi.fn(() => {
      const u = `blob:${created.length}`;
      created.push(u);
      return u;
    });
    URL.revokeObjectURL = vi.fn((u: string) => revoked.push(u));

    const file = new File(["x"], "x.png", { type: "image/png" });
    const items = [{ id: "a", file }];
    const { result, unmount } = renderHook(() =>
      useObjectUrlMap(
        items,
        (item) => item.id,
        (item) => item.file,
      ),
    );
    expect(result.current.a).toBe("blob:0");
    unmount();
    expect(revoked).toContain("blob:0");
  });

  it("returns an empty map for an empty list", () => {
    mockObjectUrls();
    const { result } = renderHook(() => useObjectUrlMap([] as Item[], getId, getFile));
    expect(result.current).toEqual({});
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("creates URLs only for newly added items", () => {
    mockObjectUrls();
    const a = makeItem("a");
    const b = makeItem("b");
    const { result, rerender } = renderHook(
      ({ items }) => useObjectUrlMap(items, getId, getFile),
      { initialProps: { items: [a] } },
    );
    expect(result.current).toEqual({ a: "blob:0" });

    rerender({ items: [a, b] });
    expect(result.current).toEqual({ a: "blob:0", b: "blob:1" });
    // "a" was already tracked — no second URL for it.
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it("revokes and drops only the item that left the list", () => {
    const revoked = mockObjectUrls();
    const a = makeItem("a");
    const b = makeItem("b");
    const { result, rerender } = renderHook(
      ({ items }) => useObjectUrlMap(items, getId, getFile),
      { initialProps: { items: [a, b] } },
    );
    expect(result.current).toEqual({ a: "blob:0", b: "blob:1" });

    rerender({ items: [b] });
    expect(result.current).toEqual({ b: "blob:1" });
    expect(revoked).toEqual(["blob:0"]);
  });
});
