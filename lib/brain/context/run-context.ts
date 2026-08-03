import type { BrainEnvironment } from "../domain/environment";

/** Scoped identity for a single Brain run — not campaign business data. */
export type BrainRunContext = {
  organizationId: string;
  peerId: string;
  campaignId?: string;
  environment: BrainEnvironment;
  actorId: string;
  permissions: readonly string[];
  requestId: string;
  correlationId: string;
  locale?: string | null;
};
