import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { openScreen } from "./support/open-screen";
import { resetRateLimits } from "./support/rate-limits";
import { SCREENS, disposeQuizCourse } from "./support/screen-list";
import { THEMES, VIEWPORTS } from "./support/screens";

const BLOCKING_IMPACTS = new Set(["serious", "critical"]);
const [DESKTOP, MOBILE] = VIEWPORTS;
const ONLY = process.env.SCREEN;

test.beforeAll(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  await disposeQuizCourse().catch(() => undefined);
});

for (const screen of SCREENS) {
  if (ONLY !== undefined && screen.name !== ONLY) continue;
  for (const theme of THEMES) {
    for (const viewport of [DESKTOP, MOBILE]) {
      if (viewport === undefined) continue;
      test(`${screen.name} has no serious accessibility violations at ${viewport.label} in ${theme} theme`, async ({
        browser,
      }) => {
        const { page, context } = await openScreen(browser, screen, viewport, theme);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const blocking = results.violations
          .filter((violation) => BLOCKING_IMPACTS.has(violation.impact ?? ""))
          .map((violation) => ({
            rule: violation.id,
            impact: violation.impact,
            targets: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")),
          }));
        expect(blocking).toEqual([]);
        await context.close();
      });
    }
  }
}
