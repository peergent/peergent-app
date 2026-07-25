import type { ContextBundle, ContextLayerKey } from "../types";

const EAGER_LAYER_KEYS: ContextLayerKey[] = [
  "identity",
  "organization",
  "objective",
  "policy",
  "telemetry",
];

const LAZY_LAYER_KEYS: ContextLayerKey[] = [
  "knowledge",
  "memory",
  "tools",
  "company-dna",
  "business-brain",
  "marketing-understanding",
  "brand-brain",
  "peer-type",
];

export function getDefaultEagerLayers() {
  return [...EAGER_LAYER_KEYS];
}

export function getDefaultLazyLayers() {
  return [...LAZY_LAYER_KEYS];
}

export function composeContext(
  scope: ContextBundle["scope"],
  layers: ContextBundle["layers"],
  options?: {
    pendingLazyLayers?: ContextLayerKey[];
    traceId?: string;
  }
): ContextBundle {
  const loadedKeys = Object.keys(layers) as ContextLayerKey[];
  const expectedLazy =
    options?.pendingLazyLayers ?? LAZY_LAYER_KEYS.filter((key) => !loadedKeys.includes(key));
  const missingLayers = expectedLazy.filter((key) => !layers[key]);
  const totalExpected = EAGER_LAYER_KEYS.length + LAZY_LAYER_KEYS.length;
  const completeness = Math.round((loadedKeys.length / totalExpected) * 100);

  return {
    scope,
    layers,
    meta: {
      completeness,
      missingLayers,
      pendingLazyLayers: missingLayers,
      traceId: options?.traceId ?? scope.sessionId,
    },
  };
}

export function mergeLayer(
  bundle: ContextBundle,
  layerKey: ContextLayerKey,
  slice: ContextBundle["layers"][ContextLayerKey]
): ContextBundle {
  const nextLayers = {
    ...bundle.layers,
    [layerKey]: slice,
  };

  const pendingLazyLayers = bundle.meta.pendingLazyLayers.filter((key) => key !== layerKey);
  const missingLayers = bundle.meta.missingLayers.filter((key) => key !== layerKey);

  return {
    ...bundle,
    layers: nextLayers,
    meta: {
      ...bundle.meta,
      pendingLazyLayers,
      missingLayers,
      completeness: Math.max(
        bundle.meta.completeness,
        Math.round((Object.keys(nextLayers).length / (getDefaultEagerLayers().length + getDefaultLazyLayers().length)) * 100)
      ),
    },
  };
}
