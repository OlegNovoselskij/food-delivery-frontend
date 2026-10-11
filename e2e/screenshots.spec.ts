import { expect, test } from "@playwright/test";

import { openScreen } from "./support/open-screen";
import { resetRateLimits } from "./support/rate-limits";
import { SCREENS, disposeQuizCourse } from "./support/screen-list";
import { SCREENSHOT_DIR, THEMES, VIEWPORTS } from "./support/screens";

test.beforeAll(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  await disposeQuizCourse().catch(() => undefined);
});

const ONLY = process.env.SCREEN;

for (const screen of SCREENS) {
  if (ONLY !== undefined && screen.name !== ONLY) continue;
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`${screen.name} at ${viewport.label} in ${theme} theme`, async ({ browser }) => {
        const { page, context } = await openScreen(browser, screen, viewport, theme);
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
