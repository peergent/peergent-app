import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Portaled Vision modals must carry the resolved theme on their root — DOM
 * ancestry is lost through createPortal.
 */
describe("PgVisionModal theme scoping", () => {
  it("portals to document.body with data-pg-theme from ThemeProvider", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/design-system/PgVisionModal.tsx"),
      "utf8"
    );

    expect(source.includes("createPortal")).toBe(true);
    expect(source.includes("document.body")).toBe(true);
    expect(source.includes("data-pg-theme={resolved}")).toBe(true);
    expect(source.includes("useTheme")).toBe(true);
  });

  it("PgContentPreviewModal uses PgVisionModal (inherits theme portal)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/design-system/PgContentPreviewModal.tsx"),
      "utf8"
    );
    expect(source.includes("PgVisionModal")).toBe(true);
  });

  it("CampaignWorkspaceModal uses PgVisionModal (inherits theme portal)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/office/campaign/CampaignWorkspaceModal.tsx"),
      "utf8"
    );
    expect(source.includes("PgVisionModal")).toBe(true);
  });
});
