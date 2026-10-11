const MAX_VISIBLE_PAGES = 7;
const EDGE_PAGES = 1;
const SIBLING_PAGES = 1;

export type PageEntry = number | null;

export function totalPagesFor(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size));
}

export function pageWindow(page: number, totalPages: number): PageEntry[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(page - SIBLING_PAGES, EDGE_PAGES + 1);
  const end = Math.min(page + SIBLING_PAGES, totalPages - EDGE_PAGES);
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const entries: PageEntry[] = [1];
  if (start > EDGE_PAGES + 1) entries.push(null);
  entries.push(...middle);
  if (end < totalPages - EDGE_PAGES) entries.push(null);
  entries.push(totalPages);
  return entries;
}
