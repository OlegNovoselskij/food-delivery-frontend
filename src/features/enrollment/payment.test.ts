import { describe, expect, it } from "vitest";

import {
  formatCardNumber,
  formatExpiry,
  paymentRequestFrom,
  paymentSchema,
  tokenForCard,
} from "./payment";

describe("formatCardNumber", () => {
  it("groups digits by four and drops other characters", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatCardNumber("4242-4242 42")).toBe("4242 4242 42");
  });

  it("limits the length", () => {
    expect(formatCardNumber("1".repeat(30)).replace(/ /g, "")).toHaveLength(19);
  });
});

describe("formatExpiry", () => {
  it("inserts the slash after the month", () => {
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("1228")).toBe("12/28");
    expect(formatExpiry("12/2899")).toBe("12/28");
  });
});

describe("tokenForCard", () => {
  it("maps the test cards to the gateway's declined tokens", () => {
    expect(tokenForCard("4000 0000 0000 0002")).toBe("tok_declined");
    expect(tokenForCard("4000 0000 0000 9995")).toBe("tok_insufficient_funds");
  });

  it("creates an accepted token for other cards", () => {
    expect(tokenForCard("4242 4242 4242 4242")).toBe("tok_card_4242");
  });
});

describe("paymentSchema", () => {
  const valid = { method: "card", cardNumber: "4242 4242 4242 4242", expiry: "12/99", cvc: "123" };

  it("accepts a complete card", () => {
    expect(paymentSchema.safeParse(valid).success).toBe(true);
  });

  it("reports every invalid card field", () => {
    const result = paymentSchema.safeParse({
      method: "card",
      cardNumber: "42",
      expiry: "01/20",
      cvc: "1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual([
        "cardNumber",
        "expiry",
        "cvc",
      ]);
    }
  });

  it("does not require card fields for PayPal", () => {
    expect(
      paymentSchema.safeParse({ method: "paypal", cardNumber: "", expiry: "", cvc: "" }).success,
    ).toBe(true);
  });
});

describe("paymentRequestFrom", () => {
  it("builds the request body for each method", () => {
    expect(paymentRequestFrom({ method: "paypal", cardNumber: "", expiry: "", cvc: "" })).toEqual({
      method: "paypal",
      payment_token: "tok_paypal",
    });
    expect(
      paymentRequestFrom({
        method: "card",
        cardNumber: "4000 0000 0000 0002",
        expiry: "12/99",
        cvc: "123",
      }),
    ).toEqual({ method: "card", payment_token: "tok_declined" });
  });
});
