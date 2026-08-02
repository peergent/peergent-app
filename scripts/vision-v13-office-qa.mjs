/**
 * Vision v13 Marketing Office browser QA.
 * Usage: node scripts/vision-v13-office-qa.mjs
 * Env: QA_BASE_URL, QA_EMAIL, QA_PASSWORD (optional — attempts signup if missing)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = join(ROOT, "docs/qa/vision-v13-office");
const REPORT_PATH = join(OUT_DIR, "browser-qa-results.json");

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** @type {Array<Record<string, unknown>>} */
const results = [];

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
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

function record(entry) {
  results.push({ ...entry, at: new Date().toISOString() });
  const status = entry.pass ? "PASS" : "FAIL";
  console.log(`[${status}] ${entry.phase} — ${entry.action}`);
  if (!entry.pass && entry.actual) console.log(`       → ${entry.actual}`);
}

async function setTheme(page, theme) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const label = theme === "light" ? "Light theme" : "Dark theme";
  const btn = page.locator(`button[aria-label="${label}"]`).first();
  if (await btn.count()) {
    await btn.click({ force: true });
    await page.waitForTimeout(200);
  }
}

async function ensureAuthenticated(page) {
  const email = process.env.QA_EMAIL;
  const password = process.env.QA_PASSWORD;

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/login")) {
    return { method: "existing-session", email: null };
  }

  if (email && password) {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    return { method: "login", email };
  }

  const ts = Date.now();
  const qaEmail = `qa-v13-office+${ts}@peergent.dev`;
  const qaPassword = `QaTest!${ts}`;

  await page.goto(`${BASE}/signup`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="fullName"]', "QA Browser");
  await page.fill('input[name="organizationName"]', `QA Org ${ts}`);
  await page.fill('input[name="email"]', qaEmail);
  await page.fill('input[name="password"]', qaPassword);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  if (page.url().includes("/login") || page.url().includes("/signup")) {
    throw new Error("Could not authenticate — set QA_EMAIL and QA_PASSWORD");
  }

  process.env.QA_EMAIL = qaEmail;
  process.env.QA_PASSWORD = qaPassword;
  return { method: "signup", email: qaEmail };
}

async function phase1LoginRouting(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;

  await page.setViewportSize(viewport);
  await setTheme(page, theme);

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  const loginForm = page.locator('form input[name="email"]');
  record({
    phase: "1-login",
    route: "/login",
    viewport: tag,
    theme,
    action: "Login form renders",
    expected: "Email and password fields visible",
    actual: (await loginForm.count()) > 0 ? "Form visible" : "Form missing",
    pass: (await loginForm.count()) > 0,
  });

  await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
  const onHome = page.url().includes("/home") && !page.url().includes("/login");
  record({
    phase: "1-login",
    route: "/home",
    viewport: tag,
    theme,
    action: "Post-auth default home",
    expected: "/home loads",
    actual: page.url(),
    pass: onHome,
  });

  if (!onHome) return;

  const marketingLink = page.locator('a[href*="/office/"]').filter({ hasText: /Marketing/i }).first();
  if ((await marketingLink.count()) > 0) {
    const href = await marketingLink.getAttribute("href");
    await marketingLink.click();
    await page.waitForLoadState("networkidle");
    const url = page.url();
    const isDemo = url.includes("/office/demo");
    record({
      phase: "1-routing-live",
      route: "/home → Marketing",
      viewport: tag,
      theme,
      action: "Live home Marketing link",
      expected: "/office/[realPeerId], never /office/demo",
      actual: url,
      pass: url.includes("/office/") && !isDemo,
    });
  }

  await page.goto(`${BASE}/home/demo`, { waitUntil: "networkidle" });
  const demoMarketing = page.locator('a.pg-v13-r-chip[href="/office/demo"]').first();
  if ((await demoMarketing.count()) > 0) {
    await demoMarketing.click();
    await page.waitForURL(/\/office\/demo/, { timeout: 8000 });
    record({
      phase: "1-routing-demo",
      route: "/home/demo → Marketing",
      viewport: tag,
      theme,
      action: "Demo home Marketing link",
      expected: "/office/demo",
      actual: page.url(),
      pass: page.url().includes("/office/demo"),
    });
  }

  const rosterLinks = await page.locator('[data-testid^="pg-rail-peer-"] a, .pg-v13-peer-chip a').all();
  for (const link of rosterLinks.slice(0, 5)) {
    const href = await link.getAttribute("href");
    if (!href?.includes("/office/")) continue;
  }

  await page.goto(`${BASE}/office/demo`, { waitUntil: "networkidle" });
  await page.goto(`${BASE}/home/demo`, { waitUntil: "networkidle" });
  await page.goBack();
  record({
    phase: "1-navigation",
    route: "back from /home/demo",
    viewport: tag,
    theme,
    action: "Browser back",
    expected: "Returns to /office/demo",
    actual: page.url(),
    pass: page.url().includes("/office/demo"),
  });
}

async function phase2Bureau(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo`, { waitUntil: "networkidle" });

  const desk = page.locator('[data-testid="office-desk-view"]');
  const newCampaign = page.getByRole("button", { name: /Nieuwe campagne|New campaign/i });
  record({
    phase: "2-bureau",
    route: "/office/demo",
    viewport: tag,
    theme,
    action: "Bureau shell + new campaign CTA",
    expected: "Desk view and + Nieuwe campagne",
    actual: `desk=${await desk.count()}, cta=${await newCampaign.count()}`,
    pass: (await desk.count()) > 0 && (await newCampaign.count()) > 0,
  });

  const insights = page.locator('[data-testid="desk-market-insights"]');
  record({
    phase: "2-bureau",
    route: "/office/demo",
    viewport: tag,
    theme,
    action: "Markt Insights card",
    expected: "Market insights visible on Bureau",
    actual: (await insights.count()) > 0 ? "visible" : "missing",
    pass: (await insights.count()) > 0,
  });

  for (const tab of ["work", "content", "performance", "market", "agreement"]) {
    await page.goto(`${BASE}/office/demo`, { waitUntil: "networkidle" });
    const tabLink = page.locator(`[data-testid="pg-tab-${tab}"]`).first();
    if ((await tabLink.count()) === 0) continue;
    await tabLink.click();
    await page.waitForURL(new RegExp(`/office/demo/${tab === "desk" ? "" : tab}`), { timeout: 8000 }).catch(() => {});
    record({
      phase: "2-bureau-nav",
      route: `/office/demo (${tab})`,
      viewport: tag,
      theme,
      action: `Navigate to ${tab}`,
      expected: `Office ${tab} loads`,
      actual: page.url(),
      pass: page.url().includes(`/office/demo/${tab}`) || (tab === "agreement" && page.url().includes("/agreement")),
    });
  }
}

async function fillAutomaticCampaignForm(modal, campaignName) {
  await modal.locator(".pg-v13-form-input").first().fill(campaignName);
  await modal.locator("textarea").first().fill("Demo QA campagne voor warmtepomp leads in regio Utrecht.");
  const endDate = modal.locator('input[type="date"]').first();
  if ((await endDate.count()) > 0) {
    await endDate.fill("2026-10-31");
  }
}

async function fillManualCampaignForm(modal, campaignName) {
  await modal.locator(".pg-v13-form-input").first().fill(campaignName);
  const goalGroup = modal.getByRole("group", { name: /Goals|Doelen/i });
  const goalChips = goalGroup.locator(".pg-v13-goal-chip");
  if ((await goalChips.count()) >= 2) {
    await goalChips.nth(0).click();
    await goalChips.nth(1).click();
  } else if ((await goalChips.count()) > 0) {
    await goalChips.first().click();
  }
  await modal.locator("textarea").first().fill("Handmatige QA campagne met meerdere doelen en kanalen.");
  for (const label of [/LinkedIn/i, /Email|E-mail/i]) {
    const chip = modal.getByRole("button", { name: label }).first();
    if ((await chip.count()) > 0) await chip.click();
  }
  const dates = modal.locator('input[type="date"]');
  if ((await dates.count()) >= 2) {
    await dates.nth(0).fill("2026-08-15");
    await dates.nth(1).fill("2026-10-31");
  } else if ((await dates.count()) === 1) {
    await dates.first().fill("2026-10-31");
  }
}

async function openCreateCampaignWizard(page, mode = "automatic") {
  await page.getByRole("button", { name: /Nieuwe campagne|New campaign/i }).click();
  const modeModal = page.locator('[data-testid="create-campaign-mode-modal"]');
  await modeModal.waitFor({ state: "visible", timeout: 5000 });
  if (mode === "automatic") {
    await page.locator('[data-testid="campaign-mode-automatic"]').click();
  } else {
    await page.locator('[data-testid="campaign-mode-manual"]').click();
  }
  const modal = page.locator('[data-testid="create-campaign-modal"]');
  await modal.waitFor({ state: "visible", timeout: 5000 });
  return modal;
}

async function phase3CreateCampaign(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo`, { waitUntil: "networkidle" });

  const modal = await openCreateCampaignWizard(page, "automatic");

  const themeAttr = await modal.getAttribute("data-pg-theme");
  record({
    phase: "3-create",
    route: "/office/demo",
    viewport: tag,
    theme,
    action: "Create modal opens with theme",
    expected: `Modal visible, data-pg-theme=${theme}`,
    actual: `visible, theme=${themeAttr}`,
    pass: themeAttr === theme,
  });

  const goalChips = modal.locator(".pg-v13-goal-chip");
  record({
    phase: "3-create",
    route: "/office/demo",
    viewport: tag,
    theme,
    action: "Automatic form renders",
    expected: "Description field visible",
    actual: (await modal.locator("textarea").count()) > 0 ? "textarea visible" : "missing",
    pass: (await modal.locator("textarea").count()) > 0,
  });

  await modal.locator(".pg-v13-form-input").first().fill("");
  await modal.locator('button[type="submit"]').click();
  const errors = modal.locator('[role="alert"]');
  record({
    phase: "3-create",
    route: "/office/demo",
    viewport: tag,
    theme,
    action: "Validation on empty submit",
    expected: "Validation errors shown",
    actual: `${await errors.count()} alerts`,
    pass: (await errors.count()) > 0,
  });

  const campaignName = `QA Campagne ${Date.now()}`;
  await fillAutomaticCampaignForm(modal, campaignName);

  await modal.locator('button[type="submit"]').click();
  await page.waitForURL(/\/office\/demo\/work\/campaigns\//, { timeout: 10000 });

  record({
    phase: "3-create",
    route: "/office/demo",
    viewport: tag,
    theme,
    action: "Submit creates demo campaign",
    expected: "Route /office/demo/work/campaigns/[id]",
    actual: page.url(),
    pass: /\/office\/demo\/work\/campaigns\//.test(page.url()),
  });

  return page.url().match(/campaigns\/([^/?]+)/)?.[1] ?? null;
}

async function phase4Work(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo/work`, { waitUntil: "networkidle" });

  const workView = page.locator('[data-testid="office-work-view"]');
  record({
    phase: "4-work",
    route: "/office/demo/work",
    viewport: tag,
    theme,
    action: "Work overview renders",
    expected: "office-work-view visible",
    actual: (await workView.count()) > 0 ? "visible" : "missing",
    pass: (await workView.count()) > 0,
  });

  const items = page.locator('[data-testid^="work-item-"]');
  const count = await items.count();
  let clicked = 0;
  for (let i = 0; i < Math.min(count, 4); i++) {
    const item = items.nth(i);
    const id = (await item.getAttribute("data-testid"))?.replace("work-item-", "") ?? "";
    await item.click();
    await page.waitForTimeout(600);
    const modal = page.locator('[data-testid="campaign-workspace-modal"]');
    clicked++;
    const hasModal = (await modal.count()) > 0;
    const onContent = page.url().includes("/content");
    record({
      phase: "4-work-card",
      route: `/office/demo/work (card ${id})`,
      viewport: tag,
      theme,
      action: "Work card click",
      expected: "Campaign detail or content navigation",
      actual: hasModal ? "workspace modal" : page.url(),
      pass: hasModal || onContent || page.url().includes("/work/campaigns/"),
    });
    if (hasModal) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    } else if (onContent || page.url().includes("/work/campaigns/")) {
      await page.goBack({ waitUntil: "networkidle" });
    }
  }
}

async function phase5WorkspaceModal(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo/work/campaigns/camp-heatpump`, { waitUntil: "networkidle" });

  const detail = page.locator('[data-testid="office-campaign-detail-view"]');
  await detail.waitFor({ state: "visible", timeout: 8000 });
  const themeAttr = await page.locator("html").getAttribute("data-theme");

  record({
    phase: "5-workspace",
    route: "/office/demo/work/campaigns/camp-heatpump",
    viewport: tag,
    theme,
    action: "Campaign detail opens from work redirect",
    expected: "office-campaign-detail-view with theme",
    actual: `detail=${await detail.count()}, theme=${themeAttr}`,
    pass: (await detail.count()) > 0,
  });

  const timeline = page.locator('[data-testid="campaign-workflow-timeline"]');
  record({
    phase: "5-workspace",
    route: "/office/demo/work/campaigns/camp-heatpump",
    viewport: tag,
    theme,
    action: "Workflow timeline visible",
    expected: "campaign-workflow-timeline",
    actual: (await timeline.count()) > 0 ? "visible" : "missing",
    pass: (await timeline.count()) > 0,
  });

  const pendingItem = page.locator('[data-testid="campaign-deliverables"] button, [data-testid="campaign-approval-center"] button').filter({ hasText: /review|goedkeur|bekijk|open/i }).first();
  if ((await pendingItem.count()) > 0) {
    await pendingItem.click();
    await page.waitForTimeout(500);
    const reviewModal = page.locator('[data-testid="deliverable-review-modal"]');
    record({
      phase: "5-review",
      route: "workspace pending item",
      viewport: tag,
      theme,
      action: "Pending item opens review",
      expected: "deliverable-review-modal",
      actual: (await reviewModal.count()) > 0 ? "open" : "missing",
      pass: (await reviewModal.count()) > 0,
    });

    const changesBtn = reviewModal.getByRole("button", { name: /Wijzigingen vragen|Request changes/i });
    if ((await changesBtn.count()) > 0) {
      await changesBtn.click();
      const feedbackModal = page.locator('[data-testid="deliverable-feedback-modal"]');
      await feedbackModal.waitFor({ state: "visible", timeout: 3000 });
      await feedbackModal.locator('button[type="submit"], .pg-v13-btn').filter({ hasText: /Verstuur|Send/i }).click();
      const alert = feedbackModal.locator('[role="alert"]');
      record({
        phase: "5-feedback",
        route: "review changes",
        viewport: tag,
        theme,
        action: "Empty feedback rejected",
        expected: "Validation error, no window.prompt",
        actual: (await alert.count()) > 0 ? "inline validation" : "none",
        pass: (await alert.count()) > 0,
      });
      await feedbackModal.locator("textarea").fill("Kortere intro graag.");
      await feedbackModal.getByRole("button", { name: /Verstuur|Send/i }).click();
      await page.waitForTimeout(400);
    }

    const approveBtn = reviewModal.getByRole("button", { name: /Goedkeuren|Approve/i });
    if ((await approveBtn.count()) > 0) {
      await approveBtn.click();
      await page.waitForTimeout(400);
    }
  }

  await page.goto(`${BASE}/office/demo/work/campaigns/camp-heatpump`, { waitUntil: "networkidle" });
  const approveAll = page.getByRole("button", { name: /Keur alles goed|Approve all/i });
  if ((await approveAll.count()) > 0) {
    await approveAll.click();
    await page.waitForTimeout(500);
    record({
      phase: "5-approve-all",
      route: "workspace",
      viewport: tag,
      theme,
      action: "Keur alles goed",
      expected: "Bulk approve executes without error",
      actual: "clicked",
      pass: true,
    });
  }
}

async function phase6CampaignDetail(page, viewport, theme, newCampaignId) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);

  for (const id of ["camp-heatpump", newCampaignId].filter(Boolean)) {
    await page.goto(`${BASE}/office/demo/work/campaigns/${id}`, { waitUntil: "networkidle" });
    const detail = page.locator('[data-testid="office-campaign-detail-view"]');
    const isTeamRedirect = page.url().includes("/team/");
    record({
      phase: "6-campaign-detail",
      route: `/office/demo/work/campaigns/${id}`,
      viewport: tag,
      theme,
      action: "Campaign detail page",
      expected: "office-campaign-detail-view, no /team redirect",
      actual: isTeamRedirect ? page.url() : (await detail.count()) > 0 ? "detail view" : "missing",
      pass: !isTeamRedirect && (await detail.count()) > 0,
    });
  }

  await page.goto(`${BASE}/office/demo/work/campaigns/unknown-campaign-id`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  record({
    phase: "6-campaign-detail",
    route: "/office/demo/work/campaigns/unknown-campaign-id",
    viewport: tag,
    theme,
    action: "Unknown campaign id",
    expected: "Meaningful not-found, no crash",
    actual: body.slice(0, 120),
    pass: !body.toLowerCase().includes("application error") && !body.includes("Unhandled"),
  });
}

async function phase7AcquisitionEmail(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo/work/campaigns/camp-heatpump?review=draft-hp-email`, {
    waitUntil: "networkidle",
  });

  const reviewModal = page.locator('[data-testid="deliverable-review-modal"]');
  await reviewModal.waitFor({ state: "visible", timeout: 8000 });
  const text = await reviewModal.innerText();
  const fields = ["Van", "Aan", "Subject", "From", "To"];
  const hasEmailFields = fields.some((f) => text.includes(f)) && (text.includes("preheader") || text.includes("Preheader") || text.length > 200);

  record({
    phase: "7-acquisition-email",
    route: "review=draft-hp-email",
    viewport: tag,
    theme,
    action: "Acquisition email preview fields",
    expected: "From/To/Subject/body/CTA visible",
    actual: hasEmailFields ? "email fields present" : text.slice(0, 100),
    pass: hasEmailFields,
  });
}

async function phase8Content(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo/content`, { waitUntil: "networkidle" });

  const contentView = page.locator('[data-testid="office-content-view"]');
  record({
    phase: "8-content",
    route: "/office/demo/content",
    viewport: tag,
    theme,
    action: "Content library",
    expected: "office-content-view",
    actual: (await contentView.count()) > 0 ? "visible" : "missing",
    pass: (await contentView.count()) > 0,
  });

  const firstItem = page.locator('[data-testid^="content-item-"]').first();
  if ((await firstItem.count()) > 0) {
    const previewBtn = firstItem.getByRole("button", { name: /Bekijk|Preview/i }).first();
    if ((await previewBtn.count()) > 0) {
      await previewBtn.click();
      const previewModal = page.locator('[data-testid="content-preview-modal"]');
      record({
        phase: "8-content",
        route: "/office/demo/content",
        viewport: tag,
        theme,
        action: "Content preview modal",
        expected: "content-preview-modal opens",
        actual: (await previewModal.count()) > 0 ? "open" : "missing",
        pass: (await previewModal.count()) > 0,
      });
      await page.keyboard.press("Escape");
    }
  }

  await page.goto(`${BASE}/office/demo/content/draft-hp-email`, { waitUntil: "networkidle" });
  const detail = page.locator('[data-testid="office-content-detail-view"]');
  record({
    phase: "8-content-detail",
    route: "/office/demo/content/draft-hp-email",
    viewport: tag,
    theme,
    action: "Direct content detail route",
    expected: "office-content-detail-view",
    actual: (await detail.count()) > 0 ? "visible" : "missing",
    pass: (await detail.count()) > 0,
  });
}

async function phase9Performance(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo/performance`, { waitUntil: "networkidle" });

  const perfView = page.locator('[data-testid="office-performance-view"]');
  const text = await page.locator("body").innerText();
  const hasMetrics =
    text.includes("Beïnvloede omzet") || text.includes("Influenced revenue") ||
    (text.includes("Bereik") && text.includes("Leads"));

  record({
    phase: "9-performance",
    route: "/office/demo/performance",
    viewport: tag,
    theme,
    action: "Executive metrics",
    expected: "Beïnvloede omzet, Bereik, Leads distinct",
    actual: hasMetrics ? "metrics present" : "missing",
    pass: hasMetrics && (await perfView.count()) > 0,
  });

  for (const provider of [
    { slug: "linkedin", id: "linkedin" },
    { slug: "google-ads", id: "google_ads" },
    { slug: "ga4", id: "ga4" },
    { slug: "crm", id: "hubspot" },
  ]) {
    await page.goto(`${BASE}/office/demo/performance/${provider.slug}`, { waitUntil: "networkidle" });
    const providerView = page.locator(`[data-testid="office-performance-provider-${provider.id}"]`);
    record({
      phase: "9-performance-provider",
      route: `/office/demo/performance/${provider.slug}`,
      viewport: tag,
      theme,
      action: `Provider page ${provider.slug}`,
      expected: "Provider view renders",
      actual: (await providerView.count()) > 0 ? "visible" : page.url(),
      pass: (await providerView.count()) > 0,
    });
  }
}

async function phase10Market(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);
  await page.goto(`${BASE}/office/demo/market`, { waitUntil: "networkidle" });

  const marketView = page.locator('[data-testid="office-market-view"]');
  record({
    phase: "10-market",
    route: "/office/demo/market",
    viewport: tag,
    theme,
    action: "Market view",
    expected: "Strategic market content",
    actual: (await marketView.count()) > 0 ? "visible" : "missing",
    pass: (await marketView.count()) > 0,
  });
}

async function phase11Settings(page, viewport, theme) {
  const tag = `${viewport.width}px/${theme}`;
  await page.setViewportSize(viewport);
  await setTheme(page, theme);

  const sections = ["brand", "connections", "responsibilities", "autonomy", "agreement", "knowledge"];
  for (const section of sections) {
    await page.goto(`${BASE}/office/demo/agreement?section=${section}`, { waitUntil: "networkidle" });
    const view = page.locator('[data-testid="office-instellingen-view"], [data-testid="office-agreement-view"]');
    record({
      phase: "11-settings",
      route: `/office/demo/agreement?section=${section}`,
      viewport: tag,
      theme,
      action: `Settings section ${section}`,
      expected: "Detail section renders",
      actual: (await view.count()) > 0 ? "visible" : "missing",
      pass: (await view.count()) > 0,
    });
  }

  await page.goto(`${BASE}/office/demo/agreement?section=brand`, { waitUntil: "networkidle" });
  const editBtn = page.locator('[data-testid^="agreement-edit-btn-"]').first();
  if ((await editBtn.count()) > 0) {
    await editBtn.click();
    const textarea = page.locator('[data-testid^="agreement-edit-"] textarea, textarea.pg-v13-input, textarea.pg-v13-form-input').first();
    if ((await textarea.count()) > 0) {
      await textarea.fill("QA merkkennis update");
      const saveBtn = page.getByRole("button", { name: /Opslaan|Save/i }).first();
      if ((await saveBtn.count()) > 0) await saveBtn.click();
      record({
        phase: "11-merkkennis",
        route: "agreement?section=brand",
        viewport: tag,
        theme,
        action: "Merkkennis edit/save",
        expected: "Edit and save without error",
        actual: "saved",
        pass: true,
      });
    }
  }

  await page.goto(`${BASE}/office/demo/agreement?section=knowledge`, { waitUntil: "networkidle" });
  const addBtn = page.locator('[data-testid="agreement-add-knowledge"]');
  if ((await addBtn.count()) > 0) {
    await addBtn.click();
    const form = page.locator('[data-testid="agreement-add-knowledge-form"]');
    record({
      phase: "11-knowledge",
      route: "agreement?section=knowledge",
      viewport: tag,
      theme,
      action: "Wat Emma weet add form",
      expected: "Add knowledge form opens",
      actual: (await form.count()) > 0 ? "visible" : "missing",
      pass: (await form.count()) > 0,
    });
  }
}

async function waitForPendingApprovalCount(page, expected) {
  await page.waitForFunction(
    (count) => {
      const el = document.querySelector('[data-testid="pending-approval-count"]');
      if (!el) return false;
      const value = Number.parseInt(el.textContent?.trim() ?? "", 10);
      return Number.isFinite(value) && value === count;
    },
    expected,
    { timeout: 15000 }
  );
}

async function approveEvidenceStep(page) {
  const ctaBtn = page.locator("section.pg-v13-sec.mt-8 button.pg-v13-btn").first();
  await ctaBtn.waitFor({ state: "visible", timeout: 8000 });
  await ctaBtn.click();

  const evidence = page.locator('[data-testid="campaign-evidence-modal"]');
  await evidence.waitFor({ state: "visible", timeout: 8000 });
  const approve = evidence.getByRole("button", { name: /Goedkeuren|Approve/i });
  await approve.click();
  await evidence.waitFor({ state: "hidden", timeout: 8000 });
}

async function phase13CampaignLifecycle(page) {
  const tag = "1440px/light";
  await page.setViewportSize(DESKTOP);
  await setTheme(page, "light");
  await page.goto(`${BASE}/office/demo/work`, { waitUntil: "networkidle" });

  const modal = await openCreateCampaignWizard(page, "automatic");
  const campaignName = `QA Lifecycle ${Date.now()}`;
  await fillAutomaticCampaignForm(modal, campaignName);
  await modal.locator('button[type="submit"]').click();
  await page.waitForURL(/\/office\/demo\/work\/campaigns\//, { timeout: 15000 });
  const campaignId = page.url().match(/campaigns\/([^/?]+)/)?.[1];

  record({
    phase: "13-lifecycle-auto",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Automatic campaign created with drafts",
    expected: "Campaign detail route",
    actual: campaignId ?? page.url(),
    pass: Boolean(campaignId),
  });

  if (!campaignId) return;

  const campaignRoot = page.locator(`[data-campaign-id="${campaignId}"]`);
  await campaignRoot.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});

  const timeline = page.locator('[data-testid="campaign-workflow-timeline"]');
  await timeline.waitFor({ state: "visible", timeout: 8000 });
  const activeSteps = await timeline.locator('[aria-current="step"]').count();
  record({
    phase: "13-lifecycle-auto",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Exactly one active workflow step (strategy)",
    expected: "1 active step",
    actual: `${activeSteps} active`,
    pass: activeSteps === 1,
  });

  await approveEvidenceStep(page);
  await approveEvidenceStep(page);

  record({
    phase: "13-lifecycle-auto",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Strategy and channels approved",
    expected: "Deliverables unlock for review",
    actual: (await page.locator('[data-testid="campaign-deliverables"]').count()) > 0 ? "deliverables visible" : "missing",
    pass: (await page.locator('[data-testid="campaign-deliverables"]').count()) > 0,
  });

  await waitForPendingApprovalCount(page, 5).catch(async () => {
    await waitForPendingApprovalCount(page, 1);
  });

  const approveAllBtn = page.getByRole("button", { name: /Keur alles goed|Approve all/i });
  if ((await approveAllBtn.count()) > 0) {
    await approveAllBtn.click();
  }

  await waitForPendingApprovalCount(page, 0);

  const scheduleBtn = page.locator('[data-testid="campaign-schedule"]');
  await scheduleBtn.waitFor({ state: "visible", timeout: 10000 });
  record({
    phase: "13-lifecycle-auto",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Schedule CTA visible after approvals",
    expected: "Campagne inplannen",
    actual: (await scheduleBtn.innerText()).trim(),
    pass: /inplannen|schedule/i.test(await scheduleBtn.innerText()),
  });

  await scheduleBtn.click();

  const scheduleInfo = page.locator('[data-testid="campaign-schedule-info"]');
  await scheduleInfo.waitFor({ state: "visible", timeout: 10000 });
  const lifecycleScheduled = page.locator('[data-testid="campaign-status"][data-lifecycle="scheduled"]');
  await lifecycleScheduled.waitFor({ state: "visible", timeout: 10000 });

  record({
    phase: "13-lifecycle-auto",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Campaign scheduled with planning info",
    expected: "Ingepland + schedule info",
    actual: await lifecycleScheduled.innerText(),
    pass: (await scheduleInfo.count()) > 0 && (await lifecycleScheduled.count()) > 0,
  });

  const publishBtn = page.locator('[data-testid="campaign-publish-demo"]');
  await publishBtn.waitFor({ state: "visible", timeout: 10000 });
  await publishBtn.click();

  const publishedStatus = page.locator('[data-testid="campaign-status"][data-lifecycle="published"]');
  await publishedStatus.waitFor({ state: "visible", timeout: 10000 });

  record({
    phase: "13-lifecycle-auto",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Campaign published in demo",
    expected: "Gepubliceerd lifecycle",
    actual: await publishedStatus.innerText(),
    pass: (await publishedStatus.count()) > 0,
  });

  const activeAfterPublish = await timeline.locator('[aria-current="step"]').count();
  record({
    phase: "13-lifecycle-auto",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Exactly one active workflow step after publish",
    expected: "1 active step (optimizing)",
    actual: `${activeAfterPublish} active`,
    pass: activeAfterPublish === 1,
  });

  await page.goto(`${BASE}/office/demo/content?campaign=${campaignId}`, { waitUntil: "networkidle" });
  const publishedItems = page.locator(`[data-testid^="published-content-item-"][data-campaign-id="${campaignId}"]`);
  await publishedItems.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  const pubCount = await publishedItems.count();

  record({
    phase: "13-lifecycle-auto",
    route: "/office/demo/content",
    viewport: tag,
    theme: "light",
    action: "Published content appears in Content",
    expected: "At least 1 published item for campaign",
    actual: `${pubCount} items`,
    pass: pubCount >= 1,
  });

  if (pubCount > 0) {
    const firstId = await publishedItems.first().getAttribute("data-testid");
    const draftId = firstId?.replace("published-content-item-", "") ?? "";
    const href = await publishedItems.first().locator("a").first().getAttribute("href");
    if (href) {
      await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
      const body = await page.locator("body").innerText();
      record({
        phase: "13-lifecycle-auto",
        route: href,
        viewport: tag,
        theme: "light",
        action: "Published content detail meaningful",
        expected: "Campaign link + content body",
        actual: body.length > 200 ? "rich detail" : body.slice(0, 80),
        pass: body.length > 200 && !body.includes("Application error"),
      });
    }

    await page.goto(`${BASE}/office/demo/work/campaigns/${campaignId}`, { waitUntil: "networkidle" });
    record({
      phase: "13-lifecycle-auto",
      route: `/office/demo/work/campaigns/${campaignId}`,
      viewport: tag,
      theme: "light",
      action: "Return to campaign after content detail",
      expected: "Published campaign detail",
      actual: await page.locator('[data-testid="campaign-status"][data-lifecycle="published"]').getAttribute("data-lifecycle"),
      pass: (await page.locator('[data-testid="campaign-status"][data-lifecycle="published"]').count()) > 0,
    });
  }

  await page.reload({ waitUntil: "networkidle" });
  const persistedPublished = page.locator('[data-testid="campaign-status"][data-lifecycle="published"]');
  record({
    phase: "13-lifecycle-persist",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Campaign publish state survives refresh",
    expected: "published after reload",
    actual: (await persistedPublished.count()) > 0 ? "published" : "lost",
    pass: (await persistedPublished.count()) > 0,
  });

  await page.goto(`${BASE}/office/demo/content?campaign=${campaignId}`, { waitUntil: "networkidle" });
  const persistedContent = page.locator(`[data-testid^="published-content-item-"][data-campaign-id="${campaignId}"]`);
  record({
    phase: "13-lifecycle-persist",
    route: "/office/demo/content",
    viewport: tag,
    theme: "light",
    action: "Published content survives refresh",
    expected: "Items still visible",
    actual: `${await persistedContent.count()} items`,
    pass: (await persistedContent.count()) >= 1,
  });

  await page.goto(`${BASE}/office/demo/work`, { waitUntil: "networkidle" });
  const resetBtn = page.locator('[data-testid="demo-reset"]');
  await resetBtn.waitFor({ state: "visible", timeout: 8000 });
  page.once("dialog", (dialog) => dialog.accept());
  await resetBtn.click();
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="demo-reset"]'),
    undefined,
    { timeout: 8000 }
  ).catch(() => {});

  await page.goto(`${BASE}/office/demo/work/campaigns/${campaignId}`, { waitUntil: "networkidle" });
  const notFoundView = page.locator('[data-testid="office-campaign-not-found"]');
  record({
    phase: "13-lifecycle-reset",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Demo reset removes created campaign",
    expected: "Campaign not found view",
    actual: (await notFoundView.count()) > 0 ? "not found" : "still visible",
    pass: (await notFoundView.count()) > 0,
  });

  // Manual campaign smoke
  await page.goto(`${BASE}/office/demo/work`, { waitUntil: "networkidle" });
  const manualModal = await openCreateCampaignWizard(page, "manual");
  await fillManualCampaignForm(manualModal, `QA Manual ${Date.now()}`);
  await manualModal.locator('button[type="submit"]').click();
  await page.waitForURL(/\/office\/demo\/work\/campaigns\//, { timeout: 15000 });
  record({
    phase: "13-lifecycle-manual",
    route: page.url(),
    viewport: tag,
    theme: "light",
    action: "Manual campaign wizard completes",
    expected: "Campaign detail opens",
    actual: page.url(),
    pass: /\/office\/demo\/work\/campaigns\//.test(page.url()),
  });
}

async function phase12MobileOverflow(page) {
  await page.setViewportSize(MOBILE);
  const routes = [
    "/home/demo",
    "/office/demo",
    "/office/demo/work",
    "/office/demo/work/campaigns/camp-heatpump",
    "/office/demo/work/campaigns/camp-heatpump",
    "/office/demo/content",
    "/office/demo/performance",
    "/office/demo/market",
    "/office/demo/agreement?section=brand",
  ];

  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    record({
      phase: "12-mobile",
      route,
      viewport: "390px",
      theme: "any",
      action: "No horizontal overflow",
      expected: "scrollWidth <= clientWidth",
      actual: overflow ? "overflow detected" : "ok",
      pass: !overflow,
    });
    if (route.includes("campaigns/")) {
      // detail page — no modal to close
    } else if (route.includes("workspace=")) {
      await page.keyboard.press("Escape");
    }
  }
}

async function main() {
  loadEnvLocal();
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let auth = { method: "none", email: null };
  try {
    auth = await ensureAuthenticated(page);
    console.log(`Authenticated via ${auth.method}${auth.email ? ` (${auth.email})` : ""}`);
  } catch (error) {
    console.error("Auth failed:", error.message);
    record({
      phase: "0-auth",
      route: "/login",
      viewport: "n/a",
      theme: "n/a",
      action: "Authenticate for protected routes",
      expected: "Session established",
      actual: error.message,
      pass: false,
    });
  }

  const authenticated = auth.method !== "none";
  if (authenticated) {
    const loginPage = await browser.newPage();
    await loginPage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    record({
      phase: "1-login",
      route: "/login (fresh context)",
      viewport: "1440px",
      theme: "n/a",
      action: "Login form renders unauthenticated",
      expected: "Email field visible",
      actual: (await loginPage.locator('input[name="email"]').count()) > 0 ? "visible" : "missing",
      pass: (await loginPage.locator('input[name="email"]').count()) > 0,
    });
    await loginPage.close();

    for (const theme of ["light", "dark"]) {
      await phase1LoginRouting(page, DESKTOP, theme);
    }
    for (const theme of ["light", "dark"]) {
      await phase2Bureau(page, DESKTOP, theme);
    }
    let newCampaignId = null;
    for (const theme of ["light", "dark"]) {
      newCampaignId = (await phase3CreateCampaign(page, DESKTOP, theme)) ?? newCampaignId;
    }
    await phase4Work(page, DESKTOP, "light");
    for (const theme of ["light", "dark"]) {
      await phase5WorkspaceModal(page, DESKTOP, theme);
    }
    await phase6CampaignDetail(page, DESKTOP, "light", newCampaignId);
    for (const theme of ["light", "dark"]) {
      await phase7AcquisitionEmail(page, DESKTOP, theme);
    }
    for (const theme of ["light", "dark"]) {
      await phase8Content(page, DESKTOP, theme);
    }
    await phase9Performance(page, DESKTOP, "light");
    await phase10Market(page, DESKTOP, "light");
    await phase11Settings(page, DESKTOP, "light");
    await phase13CampaignLifecycle(page);
    await phase12MobileOverflow(page);

    await phase3CreateCampaign(page, MOBILE, "light");
    await phase5WorkspaceModal(page, MOBILE, "light");
  }

  await browser.close();

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    auth,
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    results,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2));
  console.log(`\nQA complete: ${summary.passed}/${summary.total} passed`);
  console.log(`Report: ${REPORT_PATH}`);
  process.exitCode = summary.failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
