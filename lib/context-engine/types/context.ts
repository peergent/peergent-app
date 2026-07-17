import type { ContextScope } from "./session";
import type { SourceRef } from "./sources";

export type ContextLayerKey =
  | "identity"
  | "organization"
  | "objective"
  | "policy"
  | "knowledge"
  | "memory"
  | "tools"
  | "brain"
  | "telemetry"
  | "peer-type";

export type LoadMode = "eager" | "lazy";

export type ContextSlice<T> = {
  key: string;
  data: T;
  sources: SourceRef[];
  priority: number;
  loadMode: LoadMode;
};

export type ContextBundleMeta = {
  completeness: number;
  missingLayers: ContextLayerKey[];
  pendingLazyLayers: ContextLayerKey[];
  traceId: string;
};

export type ContextBundle = {
  scope: ContextScope;
  layers: Partial<Record<ContextLayerKey, ContextSlice<unknown>>>;
  meta: ContextBundleMeta;
};

export type BuildContextRequest = {
  organizationId: string;
  peerId: string;
  userId: string;
  membershipRole?: ContextScope["actor"]["membershipRole"];
  eagerLayers?: ContextLayerKey[];
  lazyLayers?: ContextLayerKey[];
  taskHint?: string;
};

export type PromptSection = {
  title: string;
  body: string;
  sources: SourceRef[];
};

export type PromptPackage = {
  system: PromptSection[];
  context: PromptSection[];
  constraints: PromptSection[];
  traceId: string;
};
