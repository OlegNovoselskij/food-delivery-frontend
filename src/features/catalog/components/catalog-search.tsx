import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MAX_LENGTH = 100;

interface CatalogSearchProps {
  value: string;
  onSearch: (value: string) => void;
}

export function CatalogSearch({ value, onSearch }: CatalogSearchProps) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);
  const lastSent = useRef(value);

  useEffect(() => {
    if (value === lastSent.current) return;
    lastSent.current = value;
    setText(value);
  }, [value]);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed === lastSent.current) return;
    lastSent.current = trimmed;
    onSearch(trimmed);
  }, [debounced, onSearch]);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = text.trim();
        lastSent.current = trimmed;
        onSearch(trimmed);
      }}
      className="flex max-w-3xl items-center gap-2 rounded-card border border-line-strong bg-surface p-1.5 pl-4 focus-within:border-brand-600 focus-within:shadow-focus"
    >
      <Search aria-hidden="true" className="size-5 shrink-0 text-ink" />
      <label htmlFor="catalog-search" className="sr-only">
        Search courses
      </label>
      <input
        id="catalog-search"
        type="search"
        value={text}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder="Search by title, topic or teacher"
        onChange={(event) => {
          setText(event.target.value);
        }}
        className="h-10 min-w-0 flex-1 bg-transparent px-1 text-body text-ink outline-none placeholder:text-muted focus-visible:shadow-none"
      />
      <Button type="submit" className="shrink-0">
        Search
      </Button>
    </form>
  );
}
