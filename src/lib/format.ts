const SECONDS_PER_MINUTE = 60;
const SECOND_DIGITS = 2;

export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(SECOND_DIGITS, "0");
  return `${minutes}:${rest}`;
}

export function initials(name: string, surname: string): string {
  const first = name.trim().charAt(0);
  const second = surname.trim().charAt(0);
  return `${first}${second}`.toUpperCase();
}
