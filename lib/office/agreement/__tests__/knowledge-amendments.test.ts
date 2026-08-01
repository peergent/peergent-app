import { describe, expect, it, beforeEach } from "vitest";
import {
  applyKnowledgeAmendments,
  buildMarketingAgreementViewModel,
} from "@/lib/office/agreement/build-marketing-agreement";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import {
  addDemoCustomerKnowledge,
  getDemoKnowledgeAmendments,
  resetDemoWorkspace,
  setDemoKnowledgeOverride,
} from "@/lib/office/demo/demo-workspace-state";

const base = { peerName: "Emma", peerRole: "Marketing" };

beforeEach(() => {
  resetDemoWorkspace();
});

describe("knowledge provenance separation", () => {
  it("corrections become customer_rule without removing system facts", () => {
    const model = buildMarketingAgreementViewModel({
      domainInput: buildDemoDomainInput(),
      ...base,
    });
    const amended = applyKnowledgeAmendments(model, {
      overrides: {
        tone: { value: "Nieuw: kort en direct.", correctedBy: "Jij" },
      },
      additions: [],
    });

    const tone = amended.knowledge.find((entry) => entry.id === "tone");
    expect(tone?.provenance).toBe("customer_rule");
    expect(tone?.correctedBy).toBe("Jij");

    const role = amended.knowledge.find((entry) => entry.id === "role");
    expect(role?.provenance).toBe("system_fact");
  });

  it("additions stay customer_rule and separate from emma_understanding", () => {
    const model = buildMarketingAgreementViewModel({
      domainInput: buildDemoDomainInput(),
      ...base,
    });
    const amended = applyKnowledgeAmendments(model, {
      overrides: {},
      additions: [
        {
          id: "customer:1",
          label: "Prijsbeleid",
          value: "Geen korting zonder goedkeuring.",
          provenance: "customer_rule",
          correctable: true,
          correctedBy: null,
        },
      ],
    });

    const added = amended.knowledge.find((entry) => entry.id === "customer:1");
    expect(added?.provenance).toBe("customer_rule");

    const inferred = amended.knowledge.find((entry) => entry.id === "tone");
    expect(inferred?.provenance).toBe("emma_understanding");
  });
});

describe("demo knowledge store isolation", () => {
  it("persists demo knowledge amendments in memory", () => {
    setDemoKnowledgeOverride("demo", "tone", "Aangepast", "Jij");
    addDemoCustomerKnowledge("demo", {
      id: "customer:demo-1",
      label: "Regel",
      value: "Altijd NL.",
      provenance: "customer_rule",
      correctable: true,
      correctedBy: null,
    });

    const amendments = getDemoKnowledgeAmendments();
    expect(amendments.overrides.tone?.value).toBe("Aangepast");
    expect(amendments.additions).toHaveLength(1);
  });
});
