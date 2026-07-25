import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.PREVIEW_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "docs", "screenshots", "milestone-1-studio-shell");

const scenes = ["idle", "review", "working"];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const scene of scenes) {
    const url = `${BASE_URL}/studio-shell-preview?scene=${scene}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-studio-shell="true"]', { timeout: 30_000 });
    await page.waitForTimeout(400);

    const shell = page.locator('[data-studio-shell="true"]');
    await shell.screenshot({
      path: path.join(OUT_DIR, `studio-shell-${scene}-desktop.png`),
    });

    await page.screenshot({
      path: path.join(OUT_DIR, `studio-shell-${scene}-desktop-full.png`),
      fullPage: false,
    });

    console.log(`Captured ${scene} → studio-shell-${scene}-desktop.png`);
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
