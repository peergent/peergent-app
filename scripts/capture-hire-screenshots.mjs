/**
 * Captures Hire Team journey screenshots for product review.
 * Usage: node scripts/capture-hire-screenshots.mjs
 * Requires: dev server on http://localhost:3000, playwright chromium
 */
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const assessment = JSON.parse(
  readFileSync(join(ROOT, "scripts/fixtures/linear-assessment.json"), "utf8")
);

const ASSESSMENT_KEY = "peergent-hire-assessment";
const JOURNEY_KEY = "peergent-hire-journey";

function assessmentKey(a) {
  return `${a.meta.url}::${a.meta.analyzedAt}`;
}

function journeyState(beat, extra = {}) {
  return {
    hireOperationId: "qa-hire-linear",
    assessmentKey: assessmentKey(assessment),
    beat,
    questionIndex: extra.questionIndex ?? 0,
    answers: extra.answers ?? {
      crm: "",
      leadRecipient: "",
      handover: "",
      language: "",
    },
    salesPeerId: extra.salesPeerId,
    marketingPeerId: extra.marketingPeerId,
    hireComplete: beat === "ready",
    startedAt: Date.now(),
  };
}

async function seed(page, beat, extra) {
  await page.addInitScript(
    ({ assessmentKey, assessmentJson, journeyJson, storageKeys }) => {
      sessionStorage.setItem(storageKeys.assessment, assessmentJson);
      sessionStorage.setItem(storageKeys.journey, journeyJson);
      void assessmentKey;
    },
    {
      assessmentKey: assessmentKey(assessment),
      assessmentJson: JSON.stringify(assessment),
      journeyJson: JSON.stringify(journeyState(beat, extra)),
      storageKeys: { assessment: ASSESSMENT_KEY, journey: JOURNEY_KEY },
    }
  );
}

async function capture(page, name, viewport, outDir) {
  await page.setViewportSize(viewport);
  await page.goto(`${BASE}/website-intelligence`, { waitUntil: "networkidle" });
  await page.waitForTimeout(viewport.width >= 1024 ? 600 : 400);
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`Saved ${path}`);
}

async function main() {
  mkdirSync(join(ROOT, "docs/hire-team-qa/screenshots/desktop"), { recursive: true });
  mkdirSync(join(ROOT, "docs/hire-team-qa/screenshots/mobile"), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ colorScheme: "dark" });

  const desktop = { width: 1440, height: 900 };
  const mobile = { width: 390, height: 844 };

  {
    const page = await context.newPage();
    await seed(page, "welcome");
    await capture(page, "01-welcome", desktop, join(ROOT, "docs/hire-team-qa/screenshots/desktop"));
    await page.close();
  }

  {
    const page = await context.newPage();
    await seed(page, "intro");
    await capture(page, "02-meet-the-team", desktop, join(ROOT, "docs/hire-team-qa/screenshots/desktop"));
    await capture(page, "06-meet-the-team", mobile, join(ROOT, "docs/hire-team-qa/screenshots/mobile"));
    await page.close();
  }

  {
    const page = await context.newPage();
    await seed(page, "preparing");
    await page.setViewportSize(desktop);
    await page.goto(`${BASE}/website-intelligence`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1700);
    const path = join(ROOT, "docs/hire-team-qa/screenshots/desktop/03-preparing-active.png");
    await page.screenshot({ path, fullPage: true });
    console.log(`Saved ${path}`);
    await page.close();
  }

  {
    const page = await context.newPage();
    await seed(page, "personalisation", { questionIndex: 0 });
    await capture(page, "04-personalisation-crm", desktop, join(ROOT, "docs/hire-team-qa/screenshots/desktop"));
    await page.close();
  }

  {
    const page = await context.newPage();
    await seed(page, "personalisation", {
      questionIndex: 1,
      answers: {
        crm: "HubSpot",
        leadRecipient: "alex@linear.app",
        handover: "",
        language: "",
      },
    });
    await capture(page, "07-personalisation-email", mobile, join(ROOT, "docs/hire-team-qa/screenshots/mobile"));
    await page.close();
  }

  {
    const page = await context.newPage();
    await seed(page, "ready", {
      salesPeerId: "qa-sales-peer",
      marketingPeerId: "qa-marketing-peer",
    });
    await capture(page, "05-ready", desktop, join(ROOT, "docs/hire-team-qa/screenshots/desktop"));
    await capture(page, "08-ready", mobile, join(ROOT, "docs/hire-team-qa/screenshots/mobile"));
    await page.close();
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
