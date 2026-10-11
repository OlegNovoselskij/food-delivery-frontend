import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCooldown } from "./use-cooldown";

describe("useCooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts inactive", () => {
    const { result } = renderHook(() => useCooldown());
    expect(result.current.active).toBe(false);
    expect(result.current.secondsLeft).toBe(0);
  });

  it("counts down to zero and becomes inactive", () => {
    const { result } = renderHook(() => useCooldown());
    act(() => {
      result.current.start(3);
    });
    expect(result.current.secondsLeft).toBe(3);
    expect(result.current.active).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsLeft).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.active).toBe(false);
  });

  it("can be restarted", () => {
    const { result } = renderHook(() => useCooldown());
    act(() => {
      result.current.start(1);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.start(5);
    });
    expect(result.current.secondsLeft).toBe(5);
  });
});
