import { describe, expect, it } from "vitest";

import { parseSocketMessage } from "./messages";

const notification = {
  id: 5,
  type: "course_completed",
  title: "Course completed",
  body: "Congratulations!",
  payload: { course_id: 3 },
  is_read: false,
  created_at: "2026-03-01T10:00:00Z",
};

describe("parseSocketMessage", () => {
  it("reads control messages", () => {
    expect(parseSocketMessage('{"type":"connected"}')).toEqual({ type: "connected" });
    expect(parseSocketMessage('{"type":"pong"}')).toEqual({ type: "pong" });
  });

  it("reads notifications", () => {
    const message = parseSocketMessage(JSON.stringify({ type: "notification", notification }));
    expect(message).toEqual({ type: "notification", notification });
  });

  it("ignores broken or unknown messages", () => {
    expect(parseSocketMessage("not json")).toBeNull();
    expect(parseSocketMessage('{"type":"other"}')).toBeNull();
    expect(parseSocketMessage('{"type":"notification","notification":{"id":"x"}}')).toBeNull();
  });
});
