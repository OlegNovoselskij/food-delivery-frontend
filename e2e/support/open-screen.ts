import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { seedToken } from "./api";
import type { ScreenSpec, Theme, ViewportSpec } from "./screens";
import { TOKEN_STORAGE_KEY } from "./screens";

const EXTERNAL_IMAGES = "https://picsum.photos/**";
const IDLE_TIMEOUT_MS = 2000;

export interface OpenScreen {
  page: Page;
  context: BrowserContext;
}

export async function openScreen(
  browser: Browser,
  screen: ScreenSpec,
  viewport: ViewportSpec,
  theme: Theme,
): Promise<OpenScreen> {
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
  await expect(screen.waitFor?.(page) ?? page.locator("h1").first()).toBeVisible();
  await page.waitForLoadState("networkidle", { timeout: IDLE_TIMEOUT_MS }).catch(() => undefined);
  return { page, context };
}
