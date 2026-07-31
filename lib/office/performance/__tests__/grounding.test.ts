import { describe, expect, it } from "vitest";
import {
  groundPerformancePresence,
  keepGroundedSignals,
  type GroundingEvidence,
} from "@/lib/office/performance/grounding";
import type { PerformanceSignal } from "@/lib/office/performance/types";

function evidence(overrides?: Partial<GroundingEvidence>): GroundingEvidence {
  return {
    publishedCount: 10,
    daysOfData: 30,
    connectedSources: ["Google Analytics"],
    gaps: [],
    failingSources: [],
    signals: [],
    viewLabel: "your marketing, 30 days",
    nextMilestone: null,
    ...overrides,
  };
}

function signal(overrides?: Partial<PerformanceSignal>): PerformanceSignal {
  return {
    id: "s1",
    fact: "12 published against 6 in the previous period.",
    interpretation: "Your output is up on the previous period.",
    recommendation: null,
    magnitude: 1,
    benchmark: null,
    ...overrides,
  };
}

describe("grounding gate — the ladder is descended by evidence", () => {
  it("reports a fault first, ahead of everything else", () => {
    const line = groundPerformancePresence(
      evidence({
        failingSources: ["LinkedIn"],
        signals: [signal()],
        publishedCount: 0,
      }),
      "en"
    );
    expect(line.rung).toBe("fault");
    expect(line.text).toContain("LinkedIn");
    expect(line.text).toContain("their end, not yours");
  });

  it("orients rather than concluding when nothing is published", () => {
    const line = groundPerformancePresence(
      evidence({ publishedCount: 0, signals: [signal()] }),
      "en"
    );
    expect(line.rung).toBe("orientation");
    expect(line.text).toContain("Nothing to read yet");
  });

  it("points forward with the next milestone when it knows one", () => {
    const line = groundPerformancePresence(
      evidence({ publishedCount: 0, nextMilestone: "the launch email" }),
      "en"
    );
    expect(line.text).toContain("the launch email");
  });

  it("declares the gap when nothing is connected", () => {
    const line = groundPerformancePresence(
      evidence({
        connectedSources: [],
        signals: [signal()],
        gaps: [
          {
            id: "reach",
            missing: "Google Analytics",
            unlocks: "traffic and conversions",
            ctaLabel: "Connect",
            ctaHref: "/office/emma/agreement",
          },
        ],
      }),
      "en"
    );
    expect(line.rung).toBe("gap");
    expect(line.text).toContain("I can see what I sent, not what it did");
    expect(line.text).toContain("traffic and conversions");
    expect(line.href).toBe("/office/emma/agreement");
  });

  it("qualifies a reading when there is too little elapsed data", () => {
    const line = groundPerformancePresence(
      evidence({ daysOfData: 3, signals: [signal()] }),
      "en"
    );
    expect(line.rung).toBe("qualified");
    expect(line.text).toContain("Early read");
    expect(line.text).toContain("3 days of publishing");
    expect(line.text).toContain("wouldn't act on it yet");
  });

  it("says it is too early even when it has no signal at all", () => {
    const line = groundPerformancePresence(
      evidence({ daysOfData: 2, signals: [] }),
      "en"
    );
    expect(line.rung).toBe("qualified");
    expect(line.text).toContain("too early to read");
  });

  it("interprets only when every gate has passed", () => {
    const line = groundPerformancePresence(
      evidence({ signals: [signal({ magnitude: 1 })] }),
      "en"
    );
    expect(line.rung).toBe("interpretation");
    expect(line.text).toContain("output is up");
  });

  it("falls back to observation when the movement is not notable", () => {
    const line = groundPerformancePresence(
      evidence({ signals: [signal({ magnitude: 0.02 })] }),
      "en"
    );
    expect(line.rung).toBe("observation");
    expect(line.text).toContain("Nothing has moved much");
  });

  it("treats steadiness as a finding rather than an absence", () => {
    const line = groundPerformancePresence(evidence({ signals: [] }), "en");
    expect(line.rung).toBe("observation");
    expect(line.text).toContain("holding where they were");
  });
});

describe("grounding gate — interpretation is unreachable without evidence", () => {
  it("cannot interpret with nothing published, however strong the signal", () => {
    const line = groundPerformancePresence(
      evidence({ publishedCount: 0, signals: [signal({ magnitude: 99 })] }),
      "en"
    );
    expect(line.rung).not.toBe("interpretation");
  });

  it("cannot interpret with no connected source", () => {
    const line = groundPerformancePresence(
      evidence({ connectedSources: [], signals: [signal({ magnitude: 99 })] }),
      "en"
    );
    expect(line.rung).not.toBe("interpretation");
  });

  it("cannot interpret with too few days of data", () => {
    const line = groundPerformancePresence(
      evidence({ daysOfData: 1, signals: [signal({ magnitude: 99 })] }),
      "en"
    );
    expect(line.rung).not.toBe("interpretation");
  });

  it("never emits a number it was not given", () => {
    const line = groundPerformancePresence(
      evidence({ publishedCount: 0, signals: [] }),
      "en"
    );
    expect(line.text).not.toMatch(/\d+%/);
  });
});

describe("grounding gate — signal hygiene", () => {
  it("drops a signal with no measured fact behind it", () => {
    const kept = keepGroundedSignals([
      signal({ id: "ok" }),
      signal({ id: "no-fact", fact: "   " }),
      signal({ id: "no-reading", interpretation: "" }),
      signal({ id: "no-magnitude", magnitude: Number.NaN }),
    ]);
    expect(kept.map((s) => s.id)).toEqual(["ok"]);
  });

  it("appends benchmark and recommendation to an interpretation when present", () => {
    const line = groundPerformancePresence(
      evidence({
        signals: [
          signal({
            benchmark: "That's above the category line.",
            recommendation: "I'd keep the mix as it is.",
          }),
        ],
      }),
      "en"
    );
    expect(line.text).toContain("above the category line");
    expect(line.text).toContain("keep the mix");
  });
});

describe("grounding gate — localization", () => {
  it("renders each rung in Dutch", () => {
    expect(
      groundPerformancePresence(evidence({ publishedCount: 0 }), "nl").text
    ).toContain("Nog niets te meten");

    expect(
      groundPerformancePresence(evidence({ daysOfData: 2 }), "nl").text
    ).toContain("te vroeg");

    expect(groundPerformancePresence(evidence(), "nl").text).toContain(
      "weinig veranderd"
    );
  });
});
