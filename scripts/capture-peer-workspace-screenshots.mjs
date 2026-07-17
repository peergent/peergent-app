/**
 * Captures Individual AI Peer Workspace screenshots.
 * Usage: node scripts/capture-peer-workspace-screenshots.mjs
 * Requires: dev server on http://localhost:3000, playwright chromium
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs/peer-workspace-qa/screenshots");
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

async function findPeerHref(page, peerName) {
  const row = page.locator("a.group").filter({ hasText: peerName }).first();
  await row.waitFor({ state: "visible", timeout: 15000 });
  return row.getAttribute("href");
}

async function capture(page, url, path, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path, fullPage: true });
  console.log("Saved", path);
}

async function main() {
  mkdirSync(join(OUT, "desktop"), { recursive: true });
  mkdirSync(join(OUT, "mobile"), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE}/peers`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  const salesHref = await findPeerHref(page, "Sales Peer");
  const marketingHref = await findPeerHref(page, "Marketing Peer");

  if (!salesHref) {
    throw new Error("Could not find Sales Peer in workforce roster.");
  }

  if (!marketingHref) {
    throw new Error("Could not find Marketing Peer in workforce roster.");
  }

  await capture(
    page,
    salesHref,
    join(OUT, "desktop", "01-sales-peer.png"),
    { width: 1440, height: 900 }
  );

  await capture(
    page,
    marketingHref,
    join(OUT, "desktop", "02-marketing-peer.png"),
    { width: 1440, height: 900 }
  );

  await capture(
    page,
    salesHref,
    join(OUT, "mobile", "01-sales-peer.png"),
    { width: 390, height: 844 }
  );

  await capture(
    page,
    marketingHref,
    join(OUT, "mobile", "02-marketing-peer.png"),
    { width: 390, height: 844 }
  );

  await browser.close();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
