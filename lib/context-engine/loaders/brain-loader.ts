import { createStubSource, type ContextLoader } from "./base";

export type BrainSlice = {
  available: boolean;
  summary?: string;
  coveragePercent?: number;
};

export const brainLoader: ContextLoader<BrainSlice> = {
  key: "brain",
  layerKey: "brain",
  loadMode: "lazy",
  ttlMs: 60 * 60 * 1000,
  load: () => ({
    key: "brain",
    data: {
      available: false,
      summary: undefined,
      coveragePercent: undefined,
    },
    sources: [createStubSource("brain-loader")],
    priority: 70,
    loadMode: "lazy",
  }),
};

export type MemorySlice = {
  items: string[];
  enabled: boolean;
};

export const memoryLoader: ContextLoader<MemorySlice> = {
  key: "memory",
  layerKey: "memory",
  loadMode: "lazy",
  ttlMs: 30 * 60 * 1000,
  load: () => ({
    key: "memory",
    data: {
      items: [],
      enabled: false,
    },
    sources: [createStubSource("memory-loader-stub")],
    priority: 60,
    loadMode: "lazy",
  }),
};

export type ToolsSlice = {
  available: string[];
  enabled: boolean;
};

export const toolsLoader: ContextLoader<ToolsSlice> = {
  key: "tools",
  layerKey: "tools",
  loadMode: "lazy",
  ttlMs: 15 * 60 * 1000,
  load: () => ({
    key: "tools",
    data: {
      available: [],
      enabled: false,
    },
    sources: [createStubSource("tools-loader-stub")],
    priority: 55,
    loadMode: "lazy",
  }),
};

export const telemetryLoader: ContextLoader<{ traceId: string }> = {
  key: "telemetry",
  layerKey: "telemetry",
  loadMode: "eager",
  load: ({ scope }) => ({
    key: "telemetry",
    data: { traceId: scope.sessionId },
    sources: [createStubSource("telemetry-loader")],
    priority: 5,
    loadMode: "eager",
  }),
};
