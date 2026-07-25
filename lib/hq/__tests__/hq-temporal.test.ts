import { describe, expect, it } from "vitest";
import { buildHqInitialTemporal } from "@/lib/hq/hq-temporal";

describe("buildHqInitialTemporal", () => {
  it("uses stable en-GB formatting and Europe/Amsterdam timezone", () => {
    const labels = buildHqInitialTemporal(new Date("2026-07-23T08:00:00Z"), "Europe/Amsterdam");

    expect(labels.initialDateTime).toBe("2026-07-23T08:00:00.000Z");
    expect(labels.initialDateLabel).toBe("Thursday 23 July");
    expect(labels.initialGreeting).toBe("Good morning");
  });
});
