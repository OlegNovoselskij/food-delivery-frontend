import { z } from "zod";

const PAYMENT_METHODS = ["card", "paypal"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const PAYPAL_TOKEN = "tok_paypal";
export const SUCCESS_TEST_CARD = "4242 4242 4242 4242";
export const DECLINED_TEST_CARD = "4000 0000 0000 0002";

const DECLINED_DIGITS = "4000000000000002";
const INSUFFICIENT_FUNDS_DIGITS = "4000000000009995";
const CARD_MIN_DIGITS = 13;
const CARD_MAX_DIGITS = 19;
const CARD_GROUP_SIZE = 4;
const NON_DIGITS = /\D/g;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/(\d{2})$/;
const CVC_PATTERN = /^\d{3,4}$/;
const CENTURY = 2000;

function digitsOf(value: string): string {
  return value.replace(NON_DIGITS, "");
}

export function formatCardNumber(value: string): string {
  const digits = digitsOf(value).slice(0, CARD_MAX_DIGITS);
  const groups: string[] = [];
  for (let index = 0; index < digits.length; index += CARD_GROUP_SIZE) {
    groups.push(digits.slice(index, index + CARD_GROUP_SIZE));
  }
  return groups.join(" ");
}

export function formatExpiry(value: string): string {
  const digits = digitsOf(value).slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function tokenForCard(cardNumber: string): string {
  const digits = digitsOf(cardNumber);
  if (digits === DECLINED_DIGITS) return "tok_declined";
  if (digits === INSUFFICIENT_FUNDS_DIGITS) return "tok_insufficient_funds";
  return `tok_card_${digits.slice(-CARD_GROUP_SIZE)}`;
}

function isExpired(expiry: string, now: Date): boolean {
  const match = EXPIRY_PATTERN.exec(expiry);
  if (match === null) return true;
  const month = Number(match[1]);
  const year = CENTURY + Number(match[2]);
  return new Date(year, month, 1).getTime() <= now.getTime();
}

export const paymentSchema = z
  .object({
    method: z.enum(PAYMENT_METHODS),
    cardNumber: z.string(),
    expiry: z.string(),
    cvc: z.string(),
  })
  .superRefine((values, context) => {
    if (values.method !== "card") return;
    const digits = digitsOf(values.cardNumber);
    if (digits.length < CARD_MIN_DIGITS || digits.length > CARD_MAX_DIGITS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cardNumber"],
        message: "Enter the card number",
      });
    }
    if (isExpired(values.expiry, new Date())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiry"],
        message: "Enter a valid expiry date as MM/YY",
      });
    }
    if (!CVC_PATTERN.test(values.cvc)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvc"],
        message: "Enter the 3 or 4 digit security code",
      });
    }
  });

export type PaymentValues = z.infer<typeof paymentSchema>;

export function paymentRequestFrom(values: PaymentValues): {
  method: PaymentMethod;
  payment_token: string;
} {
  return {
    method: values.method,
    payment_token: values.method === "paypal" ? PAYPAL_TOKEN : tokenForCard(values.cardNumber),
  };
}
