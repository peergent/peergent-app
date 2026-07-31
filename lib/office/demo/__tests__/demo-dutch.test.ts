import { describe, expect, it } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import { buildMarketingAgreementViewModel } from "@/lib/office/agreement/build-marketing-agreement";
import {
  OFFICE_DESTINATION_LIST,
  officeDestinationLabel,
} from "@/lib/office/destinations";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";

/**
 * The Demo Workspace ships to a Dutch audience. A single English sentence in
 * the middle of it reads as an unfinished product, and it is exactly the kind
 * of thing that survives review because everyone building it reads English.
 *
 * This walks every customer-facing string the six destinations produce and
 * fails on known English markers. It is deliberately a word list rather than a
 * language detector: false positives are cheap to fix, and a detector would
 * pass sentences that are half-translated.
 */

const NOW = new Date("2026-07-31T09:00:00.000Z");
const base = {
  peerName: "Emma",
  peerRole: "Marketing",
  localePreference: "nl",
};

const domainInput = buildDemoDomainInput({ now: NOW, locale: "nl" });
const desk = buildMarketingDeskViewModel({ domainInput, ...base });

const models: Record<string, unknown> = {
  desk,
  briefing: buildMarketingDeskBriefing({ domainInput, desk, ...base, now: NOW }),
  work: buildMarketingWorkViewModel({ domainInput, ...base }),
  performance: buildMarketingPerformanceViewModelForOffice({
    domainInput,
    ...base,
    now: NOW,
  }),
  content: buildMarketingContentViewModel({ domainInput, ...base }),
  market: buildMarketingMarketViewModel({ domainInput, ...base, now: NOW }),
  agreement: buildMarketingAgreementViewModel({ domainInput, ...base }),
};

/** Keys that carry ids, routes, enums or other machinery — never prose. */
const NON_PROSE_KEY =
  /^(id|.*Id|ids|href|.*Href|source|provider|state|status|kind|rung|category|channel|channelId|contentType|campaignId|competitorId|evidence|group|key|metricKey|unit|at|sortAt|searchBody|basedOn|origin|approvalPolicy|autonomyLevel|priority|confidence|direction|tone|subjectId)$/;

/**
 * English markers. Function words rather than nouns: "campaign" and "content"
 * are also Dutch-adjacent enough to appear legitimately, but "the", "your" and
 * "I'll" cannot survive a real translation.
 */
const ENGLISH_MARKERS = [
  " the ",
  " your ",
  " you ",
  " and ",
  " with ",
  " from ",
  " what ",
  " that ",
  " this ",
  " they ",
  " their ",
  " which ",
  " every ",
  " nothing ",
  " something ",
  " before ",
  " after ",
  " here ",
  " there ",
  " into ",
  " about ",
  " would ",
  " should ",
  " could ",
  "I'll ",
  "I'm ",
  "It's ",
  "you're ",
  "doesn't",
  "isn't",
  "won't",
  "can't",
  "Review",
  "Published",
  "Scheduled",
  "Drafts",
  "Awaiting",
  "Connect ",
  "Reported by",
  "Counted from",
  "Waiting",
  "Moving",
  "Show ",
  "Hide ",
  "Newsletter",
];

type Found = { path: string; value: string; marker: string };

function collect(value: unknown, path: string, out: Found[]): void {
  if (typeof value === "string") {
    const padded = ` ${value} `;
    for (const marker of ENGLISH_MARKERS) {
      const needle = marker.startsWith(" ") ? marker : ` ${marker}`;
      if (padded.toLowerCase().includes(needle.toLowerCase())) {
        out.push({ path, value, marker: marker.trim() });
        return;
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collect(entry, `${path}[${index}]`, out));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (NON_PROSE_KEY.test(key)) continue;
      // Copy objects hold functions; call the simple ones so their output is
      // audited too rather than skipped as unrenderable.
      if (typeof entry === "function") continue;
      collect(entry, `${path}.${key}`, out);
    }
  }
}

describe("the Demo Workspace speaks Dutch throughout", () => {
  for (const [name, model] of Object.entries(models)) {
    it(`${name} has no English left in it`, () => {
      const found: Found[] = [];
      collect(model, name, found);

      const report = found
        .map((f) => `  ${f.path}\n    [${f.marker}] ${f.value}`)
        .join("\n");
      expect(found, `English leaked into ${name}:\n${report}`).toEqual([]);
    });
  }
});

describe("the shell around the demo is Dutch too", () => {
  // Navigation, the demo badge and relative timestamps sit outside the view
  // models, which is exactly why they survived the first translation pass.
  it("names every destination in Dutch", () => {
    for (const destination of OFFICE_DESTINATION_LIST) {
      const label = officeDestinationLabel(destination, "nl");
      expect(label.trim(), `${destination.id} has no label`).not.toBe("");
      expect(
        ["Desk", "Work", "Performance", "Market", "Working agreement"],
        `${destination.id} still reads "${label}"`
      ).not.toContain(label);
    }
  });

  it("formats relative time in Dutch", () => {
    const now = Date.now();
    const cases: [number, string][] = [
      [0, "Zojuist"],
      [3 * 3600_000, "3 uur geleden"],
      [26 * 3600_000, "Gisteren"],
      [3 * 86400_000, "3 dagen geleden"],
    ];
    for (const [ago, expected] of cases) {
      expect(formatRelativeTime(new Date(now - ago).toISOString(), "nl")).toBe(expected);
    }
  });

  it("leaves English relative time alone for other locales", () => {
    expect(formatRelativeTime(new Date(Date.now() - 26 * 3600_000).toISOString())).toBe(
      "Yesterday"
    );
  });
});

describe("the agreed vocabulary is used consistently", () => {
  // These are the terms a Dutch business owner will see on more than one
  // destination. Drifting between synonyms across pages is the thing that makes
  // a product feel assembled rather than designed.
  const REQUIRED_TERMS = [
    "campagne",
    "concept",
    "goedkeur",
    "gepland",
    "gepubliceerd",
    "bereik",
    "concurrent",
    "koppel",
  ];

  // Prose only. Ids and routes legitimately carry English stems ("camp-",
  // "draft-", "?campaign="), and matching those would make the check
  // meaningless.
  const prose: string[] = [];
  const gather = (value: unknown): void => {
    if (typeof value === "string") return void prose.push(value);
    if (Array.isArray(value)) return void value.forEach(gather);
    if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) {
        if (NON_PROSE_KEY.test(key)) continue;
        if (typeof entry === "function") continue;
        gather(entry);
      }
    }
  };
  gather(models);
  const haystack = prose.join(" \n ").toLowerCase();

  for (const term of REQUIRED_TERMS) {
    it(`uses "${term}"`, () => {
      expect(haystack.includes(term), `"${term}" appears nowhere`).toBe(true);
    });
  }

  it("never mixes in the English equivalents", () => {
    const banned = ["campaign", "draft", "approval", "scheduled", "published", "reach"];
    const offenders = banned.filter((term) => haystack.includes(term));
    const examples = offenders.flatMap((term) =>
      prose.filter((line) => line.toLowerCase().includes(term)).slice(0, 3)
    );
    expect(
      offenders,
      `English vocabulary still present: ${offenders.join(", ")}\n${examples.join("\n")}`
    ).toEqual([]);
  });
});
