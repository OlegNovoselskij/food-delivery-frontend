const SHORT_WORD_LENGTH = 3;
const MAX_LABEL_LENGTH = 16;

export function coverLabel(title: string): string {
  const words = title.trim().split(/\s+/);
  const [first = "", second] = words;
  const label = first.length <= SHORT_WORD_LENGTH && second ? `${first} ${second}` : first;
  return label.slice(0, MAX_LABEL_LENGTH);
}
