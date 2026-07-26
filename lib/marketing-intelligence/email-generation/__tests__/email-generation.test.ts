import { describe, expect, it } from "vitest";

import { parseMarketingEmailCampaignResponse } from "@/lib/marketing-intelligence/email-generation";
import { validateEmailCampaignWorkUnitOutput } from "@/lib/peer-experience/marketing/runtime/validate-email-campaign-output";
import {
  isEmailCampaignWorkUnit,
  isLinkedInPostWorkUnit,
} from "@/lib/peer-experience/marketing/runtime/identify-work-unit";
import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

const peerId = "peer-1";
const projectId = "proj-1";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    subject: "Your GTM plan for Q3",
    previewText: "A concise note for founders",
    body: "A".repeat(50),
    cta: "Book a demo",
    ...overrides,
  };
}

describe("parseMarketingEmailCampaignResponse", () => {
  it("parses a valid structured email", () => {
    const result = parseMarketingEmailCampaignResponse(JSON.stringify(validPayload()));
    expect(result.success).toBe(true);
  });

  it("rejects missing subject", () => {
    const result = parseMarketingEmailCampaignResponse(
      JSON.stringify(validPayload({ subject: "" }))
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing preview text", () => {
    const result = parseMarketingEmailCampaignResponse(
      JSON.stringify(validPayload({ previewText: "  " }))
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing body", () => {
    const result = parseMarketingEmailCampaignResponse(
      JSON.stringify(validPayload({ body: "" }))
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing CTA", () => {
    const result = parseMarketingEmailCampaignResponse(JSON.stringify(validPayload({ cta: "" })));
    expect(result.success).toBe(false);
  });

  it("rejects malformed JSON", () => {
    expect(parseMarketingEmailCampaignResponse("{").success).toBe(false);
  });
});

describe("validateEmailCampaignWorkUnitOutput", () => {
  it("requires subject, preview, body, and cta", () => {
    const email = {
      id: "e1",
      workUnitId: "wu1",
      campaignId: "c1",
      subject: "Subject",
      previewText: "Preview",
      body: "B".repeat(50),
      cta: "CTA",
      createdAt: "2026-07-24T12:00:00.000Z",
      updatedAt: "2026-07-24T12:00:00.000Z",
    };
    expect(validateEmailCampaignWorkUnitOutput(email).valid).toBe(true);
  });
});

describe("isEmailCampaignWorkUnit", () => {
  it("identifies newsletter work units from planner shape", () => {
    const unit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "Launch newsletter",
      deliverableKind: "newsletter",
      channel: "Email",
      objective: "Newsletter",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Newsletter package",
    });
    expect(isEmailCampaignWorkUnit(unit)).toBe(true);
  });

  it("does not identify LinkedIn units as email", () => {
    const unit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "LinkedIn post",
      deliverableKind: "linkedin",
      channel: "LinkedIn",
      objective: "Post",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Post",
    });
    expect(isEmailCampaignWorkUnit(unit)).toBe(false);
    expect(isLinkedInPostWorkUnit(unit)).toBe(true);
  });

  it("excludes publication-style email work", () => {
    const unit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "Publish newsletter",
      deliverableKind: "newsletter",
      channel: "Email",
      objective: "Send",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Publication",
    });
    expect(isEmailCampaignWorkUnit(unit)).toBe(false);
  });

  it("does not identify generic channel placeholder units as concrete email campaigns", () => {
    const unit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "Email deliverable",
      deliverableKind: "generic",
      channel: "Email",
      objective: "Email deliverable",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Email package",
    });
    expect(isEmailCampaignWorkUnit(unit)).toBe(false);
  });

  it("identifies concrete Email — Email planner shape", () => {
    const unit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "Email — Email",
      deliverableKind: "email",
      channel: "Email",
      objective: "Email campaign",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Email package",
    });
    expect(isEmailCampaignWorkUnit(unit)).toBe(true);
  });

  it("does not identify generic LinkedIn placeholder as a LinkedIn post", () => {
    const unit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "LinkedIn deliverable",
      deliverableKind: "generic",
      channel: "LinkedIn",
      objective: "LinkedIn deliverable",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "LinkedIn package",
    });
    expect(isLinkedInPostWorkUnit(unit)).toBe(false);
  });

  it("identifies Social post — LinkedIn planner shape", () => {
    const unit = createWorkUnit({
      peerId,
      projectId,
      role: "Marketing",
      title: "Social post — LinkedIn",
      deliverableKind: "social_post",
      channel: "LinkedIn",
      objective: "Social post",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Social post package",
    });
    expect(isLinkedInPostWorkUnit(unit)).toBe(true);
  });
});
