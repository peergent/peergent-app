import type { BrainCapabilityId } from "../capabilities/registry";
import type { AsyncBrainOutputRepository } from "./contracts";
import type { UpstreamOutputResolution } from "./types";

export class UpstreamOutputResolver {
  constructor(private readonly outputs: AsyncBrainOutputRepository) {}

  async resolve(input: {
    organizationId: string;
    capabilityId: BrainCapabilityId;
    capabilityVersion: string;
    campaignId?: string;
    explicitOutputId?: string;
    requireFresh?: boolean;
  }): Promise<UpstreamOutputResolution> {
    if (input.explicitOutputId) {
      const record = await this.outputs.getRecordById(input.organizationId, input.explicitOutputId);
      if (!record) {
        return { accepted: false, reason: "Explicit output reference not found." };
      }
      if (record.capabilityId !== input.capabilityId) {
        return { accepted: false, reason: "Explicit output capability mismatch." };
      }
      if (record.freshness !== "fresh" && input.requireFresh) {
        return { accepted: false, reason: "Explicit output is stale." };
      }
      return { accepted: true, output: record, reason: "Explicit output reference accepted." };
    }

    const latest = await this.outputs.getLatestCompatible({
      organizationId: input.organizationId,
      capabilityId: input.capabilityId,
      capabilityVersion: input.capabilityVersion,
      campaignId: input.campaignId,
      freshness: input.requireFresh ? "fresh" : "any",
    });

    if (!latest) {
      return { accepted: false, reason: "No compatible upstream output available." };
    }

    if (latest.capabilityVersion !== input.capabilityVersion) {
      return {
        accepted: false,
        reason: `Capability version mismatch (${latest.capabilityVersion} vs ${input.capabilityVersion}).`,
      };
    }

    if (latest.freshness !== "fresh" && input.requireFresh) {
      return { accepted: false, reason: "Latest upstream output is stale." };
    }

    return { accepted: true, output: latest, reason: "Latest compatible fresh output accepted." };
  }
}
