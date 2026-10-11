import { expect, test } from "@playwright/test";

import { seedToken } from "./support/api";
import { SCREENS } from "./support/screen-list";
import { SCREENSHOT_DIR, THEMES, TOKEN_STORAGE_KEY, VIEWPORTS } from "./support/screens";

const EXTERNAL_IMAGES = "https://picsum.photos/**";
const IDLE_TIMEOUT_MS = 2000;
const ONLY = process.env.SCREEN;

for (const screen of SCREENS) {
  if (ONLY !== undefined && screen.name !== ONLY) continue;
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`${screen.name} at ${viewport.label} in ${theme} theme`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: theme,
        });
        const token =
          screen.signedInAs !== undefined
            ? await seedToken(screen.signedInAs)
            : await screen.tokenFor?.();
        if (token !== undefined) {
          await context.addInitScript(
            ([key, value]) => {
              window.localStorage.setItem(key, value);
            },
            [TOKEN_STORAGE_KEY, token] as const,
          );
        }
        await context.route(EXTERNAL_IMAGES, (route) => route.abort());
        const page = await context.newPage();
        await screen.intercept?.(page);
        const path = typeof screen.path === "string" ? screen.path : await screen.path();
        await page.goto(path);
        await screen.prepare?.(page);
        const anchor = screen.waitFor?.(page) ?? page.locator("h1").first();
        await expect(anchor).toBeVisible();
        await page
          .waitForLoadState("networkidle", { timeout: IDLE_TIMEOUT_MS })
          .catch(() => undefined);
        const hasHorizontalScroll = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(hasHorizontalScroll).toBe(false);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/${screen.name}-${theme}-${viewport.label}.png`,
          fullPage: true,
          animations: "disabled",
        });
        await context.close();
      });
    }
  }
}
