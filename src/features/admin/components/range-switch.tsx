import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { SegmentedControl } from "@/components/ui/segmented-control";

import { DEFAULT_RANGE, RANGES, RANGE_PARAM, parseRange, type RangeValue } from "../range";

export function useRange() {
  const [params, setParams] = useSearchParams();
  const range = parseRange(params);
  const setRange = useCallback(
    (next: RangeValue) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next === DEFAULT_RANGE) updated.delete(RANGE_PARAM);
          else updated.set(RANGE_PARAM, next);
          return updated;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return { range, setRange };
}

interface RangeSwitchProps {
  range: RangeValue;
  onChange: (range: RangeValue) => void;
}

export function RangeSwitch({ range, onChange }: RangeSwitchProps) {
  return (
    <SegmentedControl
      label="Time range"
      value={range}
      options={RANGES.map(({ value, label }) => ({ value, label }))}
      onChange={onChange}
    />
  );
}
