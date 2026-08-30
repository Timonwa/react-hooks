import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageTitleProvider, usePageTitle } from "../index.js";

describe("usePageTitle", () => {
  it("registers the page's title and follows changes", () => {
    const { result, rerender } = renderHook(({ t }) => usePageTitle(t), {
      initialProps: { t: "Events" },
      wrapper: PageTitleProvider,
    });
    expect(result.current.title).toBe("Events");
    rerender({ t: "Albums" });
    expect(result.current.title).toBe("Albums");
  });

  it("throws the guidance error outside the provider", () => {
    expect(() => renderHook(() => usePageTitle())).toThrow(/PageTitleProvider/);
  });

  it("clears the title when the page stops registering one", () => {
    const { result, rerender } = renderHook(({ t }) => usePageTitle(t), {
      initialProps: { t: "Events" as string | undefined },
      wrapper: PageTitleProvider,
    });
    expect(result.current.title).toBe("Events");
    rerender({ t: undefined });
    expect(result.current.title).toBe(null);
  });

  it("starts at null for readers and follows setTitle directly", () => {
    const { result } = renderHook(() => usePageTitle(), { wrapper: PageTitleProvider });
    expect(result.current.title).toBe(null);
    act(() => result.current.setTitle("Albums"));
    expect(result.current.title).toBe("Albums");
  });
});
