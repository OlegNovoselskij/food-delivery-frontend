import { z } from "zod";

const NAME_MAX_LENGTH = 50;
const PHONE_MAX_LENGTH = 20;
export const BIO_MAX_LENGTH = 1000;

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}`)
    .max(NAME_MAX_LENGTH, `Use at most ${NAME_MAX_LENGTH} characters`);

export const profileSchema = z.object({
  name: nameSchema("first name"),
  surname: nameSchema("last name"),
  phone: z.string().trim().max(PHONE_MAX_LENGTH, `Use at most ${PHONE_MAX_LENGTH} characters`),
  bio: z.string().trim().max(BIO_MAX_LENGTH, `Use at most ${BIO_MAX_LENGTH} characters`),
});

export type ProfileValues = z.infer<typeof profileSchema>;
