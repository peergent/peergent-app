import { fetchPeerForContext } from "@/lib/context-engine/data/queries";
import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { createContextItem } from "../normalize/context-item";

export const peerContextAdapter: ContextSourceAdapter = {
  id: "peer",
  categories: ["peer"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    if (!input.peerId) {
      return {
        adapterId: "peer",
        status: "skipped",
        items: [],
        durationMs: Date.now() - started,
      };
    }

    try {
      const peer = await fetchPeerForContext(input.supabase, input.peerId, input.organizationId);
      if (!peer) {
        return {
          adapterId: "peer",
          status: "failed",
          items: [],
          failureCode: "peer_not_found",
          failureMessage: "Peer not found for organization.",
          durationMs: Date.now() - started,
        };
      }

      if (peer.organization_id && peer.organization_id !== input.organizationId) {
        return {
          adapterId: "peer",
          status: "failed",
          items: [],
          failureCode: "authorization_violation",
          failureMessage: "Peer organization mismatch.",
          durationMs: Date.now() - started,
        };
      }

      const at = new Date().toISOString();
      const items = [
        createContextItem({
          category: "peer",
          key: "peer.identity",
          label: "Peer",
          summary: `${peer.name} — ${peer.role}`,
          organizationId: input.organizationId,
          peerId: peer.id,
          provenance: { kind: "company_profile", refId: peer.id, label: peer.name, capturedAt: at },
          sourceAdapterId: "peer",
          confidence: "high",
        }),
        createContextItem({
          category: "peer",
          key: "peer.objective",
          label: "Peer objective",
          summary: peer.objective || "No objective recorded.",
          organizationId: input.organizationId,
          peerId: peer.id,
          provenance: { kind: "company_profile", refId: `${peer.id}:objective`, capturedAt: at },
          sourceAdapterId: "peer",
          confidence: peer.objective ? "medium" : "unknown",
        }),
      ];

      return {
        adapterId: "peer",
        status: "completed",
        items,
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        adapterId: "peer",
        status: "failed",
        items: [],
        failureCode: "peer_load_failed",
        failureMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
      };
    }
  },
};
