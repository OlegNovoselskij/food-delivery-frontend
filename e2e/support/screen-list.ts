import { SEED_USERS } from "./api";
import type { ScreenSpec } from "./screens";

const REGISTER_URL = "**/api/v1/auth/register";

export const SCREENS: readonly ScreenSpec[] = [
  { name: "landing", path: "/" },
  { name: "not-found", path: "/no/such/page" },
  { name: "forbidden", path: "/403" },
  { name: "sign-in", path: "/sign-in" },
  { name: "sign-up", path: "/sign-up" },
  {
    name: "sign-up-code",
    path: "/sign-up",
    prepare: async (page) => {
      await page.route(REGISTER_URL, (route) =>
        route.fulfill({ status: 202, json: { message: "sent" } }),
      );
      await page.getByLabel("First name").fill("Andrii");
      await page.getByLabel("Last name").fill("Kovalenko");
      await page.getByLabel("Email").fill("andrii@demo.example.com");
      await page.getByRole("button", { name: "Send confirmation code" }).click();
      await page.getByRole("heading", { name: "Check your email" }).waitFor();
      await page.getByRole("textbox", { name: "Digit 1 of 6" }).click();
      await page.keyboard.type("4718");
    },
  },
  { name: "forgot-password", path: "/forgot-password" },
  { name: "reset-password", path: "/reset-password?email=andrii%40demo.example.com" },
  { name: "profile", path: "/profile", signedInAs: SEED_USERS.student },
];
