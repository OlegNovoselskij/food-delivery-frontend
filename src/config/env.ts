import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:8000"),
  VITE_GOOGLE_CLIENT_ID: z.string().default(""),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid frontend environment: ${problems}`);
}

export const env = {
  apiUrl: parsed.data.VITE_API_URL.replace(/\/+$/, ""),
  googleClientId: parsed.data.VITE_GOOGLE_CLIENT_ID,
} as const;
