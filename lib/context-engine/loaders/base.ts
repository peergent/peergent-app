import type { ContextLayerKey, ContextScope } from "../types";
import type { SourceRef } from "../types/sources";

export type LoaderContext = {
  scope: ContextScope;
  taskHint?: string;
  signal?: AbortSignal;
};

export type ContextSliceResult<T> = {
  key: string;
  data: T;
  sources: SourceRef[];
  priority: number;
  loadMode: "eager" | "lazy";
};

export type ContextLoader<T> = {
  key: ContextLayerKey | string;
  layerKey: ContextLayerKey;
  loadMode: "eager" | "lazy";
  ttlMs?: number;
  load: (ctx: LoaderContext) => Promise<ContextSliceResult<T>> | ContextSliceResult<T>;
};

export function createStubSource(label: string): SourceRef {
  return {
    id: `stub:${label}`,
    type: "derived",
    label,
    fetchedAt: new Date().toISOString(),
    freshness: "cached",
  };
}
