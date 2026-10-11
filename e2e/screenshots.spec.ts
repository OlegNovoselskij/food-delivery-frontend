import { expect, test } from "@playwright/test";

import { seedToken } from "./support/api";
import { SCREENS } from "./support/screen-list";
import { SCREENSHOT_DIR, THEMES, TOKEN_STORAGE_KEY, VIEWPORTS } from "./support/screens";

for (const screen of SCREENS) {
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`${screen.name} at ${viewport.label} in ${theme} theme`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: theme,
        });
        if (screen.signedInAs !== undefined) {
          const token = await seedToken(screen.signedInAs);
          await context.addInitScript(
            ([key, value]) => {
              window.localStorage.setItem(key, value);
            },
            [TOKEN_STORAGE_KEY, token] as const,
          );
        }
        const page = await context.newPage();
        await page.goto(screen.path);
        await screen.prepare?.(page);
        await expect(page.locator("h1").first()).toBeVisible();
        await screen.ready?.(page);
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
