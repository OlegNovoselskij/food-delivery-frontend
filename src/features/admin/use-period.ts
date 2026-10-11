import { useMemo, useState } from "react";

import { periodFor, type RangeValue } from "./range";

export function usePeriod(range: RangeValue) {
  const [now] = useState(() => new Date());
  return useMemo(() => periodFor(range, now), [range, now]);
}
