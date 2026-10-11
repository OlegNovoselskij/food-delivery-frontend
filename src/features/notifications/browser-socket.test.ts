import { describe, expect, it } from "vitest";

import { buildSocketUrl } from "./browser-socket";

describe("buildSocketUrl", () => {
  it("switches to ws for http origins and keeps the port", () => {
    expect(buildSocketUrl("http://localhost:8000", "abc")).toBe(
      "ws://localhost:8000/api/v1/ws?ticket=abc",
    );
  });

  it("switches to wss for https origins and encodes the ticket", () => {
    expect(buildSocketUrl("https://api.example.com", "a b+c")).toBe(
      "wss://api.example.com/api/v1/ws?ticket=a+b%2Bc",
    );
  });
});
