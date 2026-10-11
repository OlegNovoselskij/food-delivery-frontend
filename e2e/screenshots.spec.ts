import { expect, test } from "@playwright/test";

import { SCREENSHOT_DIR, THEMES, VIEWPORTS, type ScreenSpec } from "./support/screens";

const SCREENS: readonly ScreenSpec[] = [
  { name: "landing", path: "/" },
  { name: "not-found", path: "/no/such/page" },
];

for (const screen of SCREENS) {
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`${screen.name} at ${viewport.label} in ${theme} theme`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: theme,
        });
        const page = await context.newPage();
        await page.goto(screen.path);
        await screen.prepare?.(page);
        await expect(page.locator("h1").first()).toBeVisible();
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
