const FREE_AMOUNT = /^0*(\.0*)?$/;

const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const wholeCurrencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function isFree(amount: string): boolean {
  return FREE_AMOUNT.test(amount.trim());
}

export function formatPrice(amount: string): string {
  return isFree(amount) ? "Free" : currencyFormat.format(Number(amount));
}

export function formatMoney(amount: string | number): string {
  return currencyFormat.format(Number(amount));
}

export function formatWholeMoney(amount: string | number): string {
  return wholeCurrencyFormat.format(Number(amount));
}

export function formatCompactMoney(amount: string | number): string {
  return compactCurrencyFormat.format(Number(amount));
}
