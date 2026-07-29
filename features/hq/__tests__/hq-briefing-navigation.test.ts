import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HQ briefing navigation", () => {
  it("Open briefing links to Command Center at /home", () => {
    const path = join(process.cwd(), "features/hq/components/BriefingNotification.tsx");
    const source = readFileSync(path, "utf8");
    expect(source).toContain('href="/home"');
    expect(source).toMatch(/Open briefing/);
  });
});
