import type { ContextLayerKey } from "../types";

export const LAYER_TTL_MS: Partial<Record<ContextLayerKey, number>> = {
  identity: 5 * 60 * 1000,
  organization: 5 * 60 * 1000,
  objective: 5 * 60 * 1000,
  policy: 5 * 60 * 1000,
  telemetry: 5 * 60 * 1000,
  knowledge: 15 * 60 * 1000,
  tools: 15 * 60 * 1000,
  memory: 30 * 60 * 1000,
  brain: 60 * 60 * 1000,
  "peer-type": 15 * 60 * 1000,
};

export function getLayerTtl(layerKey: ContextLayerKey) {
  return LAYER_TTL_MS[layerKey] ?? 5 * 60 * 1000;
}
