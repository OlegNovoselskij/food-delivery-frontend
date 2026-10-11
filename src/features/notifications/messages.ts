import { z } from "zod";

const notificationSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  payload: z.record(z.string(), z.unknown()),
  is_read: z.boolean(),
  created_at: z.string(),
});

const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("connected") }),
  z.object({ type: z.literal("pong") }),
  z.object({ type: z.literal("notification"), notification: notificationSchema }),
]);

export type SocketMessage = z.infer<typeof messageSchema>;

export function parseSocketMessage(raw: string): SocketMessage | null {
  try {
    const parsed = messageSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
