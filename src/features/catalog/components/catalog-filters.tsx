import type { Category } from "@/api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

import {
  PRICE_FILTERS,
  SORT_OPTIONS,
  type CatalogFilters,
  type PriceFilter,
  type SortOption,
} from "../search-params";

const PRICE_LABELS: Record<PriceFilter, string> = {
  all: "Free and paid",
  free: "Free only",
  paid: "Paid only",
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

function isPriceFilter(value: string): value is PriceFilter {
  return PRICE_FILTERS.some((option) => option === value);
}

function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

const chipClass =
  "inline-flex h-8 items-center rounded-full border px-3.5 text-small font-medium transition-colors";

interface CatalogFiltersProps {
  filters: CatalogFilters;
  categories: readonly Category[];
  onChange: (changes: Partial<CatalogFilters>) => void;
}

export function CatalogFilterBar({ filters, categories, onChange }: CatalogFiltersProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Categories" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={filters.category === null}
          onClick={() => {
            onChange({ category: null });
          }}
          className={cn(
            chipClass,
            filters.category === null
              ? "border-ink bg-ink text-paper"
              : "border-line bg-surface text-ink-soft hover:bg-sunken",
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={filters.category === category.id}
            onClick={() => {
              onChange({ category: category.id });
            }}
            className={cn(
              chipClass,
              filters.category === category.id
                ? "border-ink bg-ink text-paper"
                : "border-line bg-surface text-ink-soft hover:bg-sunken",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.price}
          onValueChange={(value) => {
            if (isPriceFilter(value)) onChange({ price: value });
          }}
        >
          <SelectTrigger aria-label="Price filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICE_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {PRICE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(value) => {
            if (isSortOption(value)) onChange({ sort: value });
          }}
        >
          <SelectTrigger aria-label="Sort order">
            <span>
              Sort: <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
