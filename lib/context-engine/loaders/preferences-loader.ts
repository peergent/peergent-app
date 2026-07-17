import { createStubSource, type ContextLoader } from "./base";

export type PolicySlice = {
  autonomy: "assist" | "collaborate" | "autopilot";
  canActIndependently: boolean;
  requiresApprovalFor: string[];
};

export const policyLoader: ContextLoader<PolicySlice> = {
  key: "policy",
  layerKey: "policy",
  loadMode: "eager",
  ttlMs: 5 * 60 * 1000,
  load: () => ({
    key: "policy",
    data: {
      autonomy: "collaborate",
      canActIndependently: false,
      requiresApprovalFor: ["external-send", "pricing-change", "refund"],
    },
    sources: [createStubSource("policy-loader-placeholder")],
    priority: 40,
    loadMode: "eager",
  }),
};

/** @deprecated Use policyLoader */
export const preferencesLoader = policyLoader;
