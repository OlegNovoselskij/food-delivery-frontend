import type { Page } from "@playwright/test";

export interface ViewportSpec {
  label: string;
  width: number;
  height: number;
}

export const VIEWPORTS: readonly ViewportSpec[] = [
  { label: "1440", width: 1440, height: 900 },
  { label: "390", width: 390, height: 844 },
];

export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export interface ScreenSpec {
  name: string;
  path: string;
  prepare?: (page: Page) => Promise<void>;
}

export const SCREENSHOT_DIR = "docs/screenshots";
