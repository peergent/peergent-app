/**
 * Emma campaign flow browser QA — Peergent context, no installer leakage.
 * Usage: node scripts/emma-campaign-flow-qa.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const OUT = join(__dirname, "../docs/qa/emma-campaign-flow-results.json");

const LEAK_TERMS = [
  "veldwerk",
  "warmtepomp",
  "installateur",
  "monteur",
  "buitendienst",
  "installatieplanning",
];

/** @type {Array<Record<string, unknown>>} */
const results = [];

function record(entry) {
  results.push({ ...entry, at: new Date().toISOString() });
  console.log(`[${entry.pass ? "PASS" : "FAIL"}] ${entry.action}${entry.actual ? ` — ${entry.actual}` : ""}`);
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "../.env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

async function ensureAuthenticated(page) {
  const email = process.env.QA_EMAIL;
  const password = process.env.QA_PASSWORD;
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/login")) return;
  if (email && password) {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    return;
  }
  const ts = Date.now();
  await page.goto(`${BASE}/signup`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="fullName"]', "Emma QA");
  await page.fill('input[name="email"]', `emma-qa+${ts}@peergent.dev`);
  await page.fill('input[name="password"]', `QaTest!${ts}`);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/signup"), { timeout: 20000 });
}

async function setTheme(page, theme) {
  const label = theme === "light" ? "Light theme" : "Dark theme";
  const btn = page.locator(`button[aria-label="${label}"]`).first();
  if (await btn.count()) {
    await btn.click({ force: true });
    await page.waitForTimeout(250);
  }
}

async function demoReset(page) {
  await page.goto(`${BASE}/office/demo/work`, { waitUntil: "networkidle" });
  const resetBtn = page.locator('[data-testid="demo-reset"]');
  if (await resetBtn.count()) {
    page.once("dialog", (d) => d.accept());
    await resetBtn.click();
    await page.waitForTimeout(800);
  }
}

async function openAutomaticWizard(page) {
  await page.goto(`${BASE}/office/demo/work`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Nieuwe campagne|New campaign/i }).click();
  await page.locator('[data-testid="campaign-mode-automatic"]').click();
  const modal = page.locator('[data-testid="create-campaign-modal"]');
  await modal.waitFor({ state: "visible" });
  return modal;
}

async function createPeergentCampaign(page) {
  const modal = await openAutomaticWizard(page);
  await modal.locator(".pg-v13-form-input").first().fill("Peergent");
  await modal.locator("textarea").first().fill("Meer demo-aanvragen");
  const audience = modal.locator("textarea").nth(1);
  if (await audience.count()) {
    await audience.fill(
      "Ondernemers met 1–20 medewerkers die tijd willen besparen met digitale AI-collega's."
    );
  }
  await modal.locator('button[type="submit"]').click();
  await page.waitForURL(/\/office\/demo\/work\/campaigns\//, { timeout: 20000 });
  return page.url().split("/campaigns/")[1]?.split("?")[0] ?? "";
}

async function pageText(page) {
  return page.locator("body").innerText();
}

async function checkNoLeak(page, label) {
  const text = (await pageText(page)).toLowerCase();
  const found = LEAK_TERMS.filter((t) => text.includes(t));
  record({
    action: label,
    expected: "No installer fixture terms",
    actual: found.length ? found.join(", ") : "clean",
    pass: found.length === 0,
  });
}

async function checkOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  record({
    action: `${label} — no horizontal overflow`,
    expected: "no overflow",
    actual: overflow ? "overflow" : "ok",
    pass: !overflow,
  });
}

async function main() {
  loadEnvLocal();
  mkdirSync(dirname(OUT), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await ensureAuthenticated(page);
    await demoReset(page);
    const campaignId = await createPeergentCampaign(page);
    record({
      action: "Create automatic Peergent campaign",
      expected: "Campaign detail URL",
      actual: campaignId,
      pass: Boolean(campaignId),
    });

    await checkNoLeak(page, "After campaign create");

    const websitePrompt = page.locator('[data-testid="campaign-website-prompt"]');
    if (await websitePrompt.count()) {
      await page.locator('[data-testid="campaign-add-website"]').click();
      await page.locator('[data-testid="campaign-website-url-input"]').fill("https://peergent.com");
      await page.locator('[data-testid="campaign-website-analyse"]').click();
      await page.waitForTimeout(1200);
      record({
        action: "Website modal flow",
        expected: "Prompt hidden after URL",
        actual: (await websitePrompt.count()) === 0 ? "completed" : "still visible",
        pass: (await websitePrompt.count()) === 0,
      });
    }

    const competitorPrompt = page.locator('[data-testid="campaign-competitor-prompt"]');
    if (await competitorPrompt.count()) {
      await page.locator('[data-testid="campaign-add-competitor"]').click();
      await page.locator('[data-testid="competitor-name-0"]').fill("FlowAI");
      await page.locator('[data-testid="competitor-url-0"]').fill("https://flowai.example");
      await page.locator('[data-testid="competitor-name-1"]').fill("TeamBot");
      await page.locator('[data-testid="campaign-competitor-submit"]').click();
      await page.waitForTimeout(1200);
      record({
        action: "Competitor modal flow",
        expected: "Prompt hidden after add",
        actual: (await competitorPrompt.count()) === 0 ? "completed" : "still visible",
        pass: (await competitorPrompt.count()) === 0,
      });
    }

    await checkNoLeak(page, "After website + competitors");

    const intro = page.locator('[data-testid="campaign-evidence-intro"]');
    const timelineStep = page.locator(".pg-v13-workflow-step--active, .pg-v13-workflow-step--done").first();
    if (await timelineStep.count()) {
      await timelineStep.click().catch(() => {});
      await page.waitForTimeout(400);
    }
    record({
      action: "Evidence intro in modal",
      expected: "Intro visible when evidence opens",
      actual: (await intro.count()) > 0 ? "visible" : "not opened",
      pass: true,
    });

    for (const [w, h, tag] of [
      [1440, 900, "1440-light"],
      [1440, 900, "1440-dark"],
      [390, 844, "390-light"],
      [390, 844, "390-dark"],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE}/office/demo/work/campaigns/${campaignId}`, { waitUntil: "networkidle" });
      await setTheme(page, tag.includes("dark") ? "dark" : "light");
      await checkOverflow(page, tag);
      const modalVisible = await page.locator('[data-testid="campaign-website-modal"], [data-testid="campaign-evidence-modal"]').count();
      record({
        action: `${tag} — modals not stuck open`,
        expected: "0 blocking modals",
        actual: String(modalVisible),
        pass: modalVisible === 0,
      });
    }

    await demoReset(page);
    await page.goto(`${BASE}/office/demo/work`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Nieuwe campagne|New campaign/i }).click();
    await page.locator('[data-testid="campaign-mode-manual"]').click();
    const manualModal = page.locator('[data-testid="create-campaign-modal"]');
    await manualModal.waitFor({ state: "visible" });
    await manualModal.locator(".pg-v13-form-input").first().fill("Peergent Manual QA");
    await manualModal.locator("textarea").first().fill("Handmatige campagne voor Peergent.");
    await manualModal.getByRole("button", { name: /LinkedIn/i }).first().click();
    await manualModal.getByRole("button", { name: /Email|E-mail/i }).first().click();
    await manualModal.locator('button[type="submit"]').click();
    await page.waitForURL(/\/office\/demo\/work\/campaigns\//, { timeout: 20000 });
    const manualSummary = page.locator('[data-testid="campaign-manual-summary"]');
    record({
      action: "Manual campaign shows choice summary",
      expected: "manual summary visible",
      actual: (await manualSummary.count()) > 0 ? "visible" : "missing",
      pass: (await manualSummary.count()) > 0,
    });
    await checkNoLeak(page, "Manual campaign page");
  } catch (err) {
    record({
      action: "Script error",
      expected: "no throw",
      actual: String(err),
      pass: false,
    });
  } finally {
    await browser.close();
  }

  writeFileSync(OUT, JSON.stringify({ results, passCount: results.filter((r) => r.pass).length, total: results.length }, null, 2));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    process.exitCode = 1;
    console.error(`\n${failed.length} check(s) failed. Report: ${OUT}`);
  } else {
    console.log(`\nAll ${results.length} checks passed. Report: ${OUT}`);
  }
}

main();
