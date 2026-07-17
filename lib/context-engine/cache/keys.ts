import type { ContextLayerKey } from "../types";

export function buildCacheKey(input: {
  organizationId: string;
  peerId: string;
  layerKey: ContextLayerKey | string;
  schemaVersion?: number;
}) {
  const version = input.schemaVersion ?? 1;
  return `org:${input.organizationId}:peer:${input.peerId}:layer:${input.layerKey}:v${version}`;
}
