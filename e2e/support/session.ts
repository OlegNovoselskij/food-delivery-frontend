import type { Page } from "@playwright/test";

import { TOKEN_STORAGE_KEY } from "./screens";

export async function useToken(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [TOKEN_STORAGE_KEY, token] as const,
  );
}
