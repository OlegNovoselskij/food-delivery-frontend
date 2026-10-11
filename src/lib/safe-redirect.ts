export function safeNextPath(value: string | null): string | null {
  if (value === null) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function signInPathFor(destination: string): string {
  return `/sign-in?next=${encodeURIComponent(destination)}`;
}
