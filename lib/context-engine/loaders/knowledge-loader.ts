import { createStubSource, type ContextLoader } from "./base";

export type KnowledgeSlice = {
  domains: string[];
  documents: string[];
  connected: boolean;
};

export const knowledgeLoader: ContextLoader<KnowledgeSlice> = {
  key: "knowledge",
  layerKey: "knowledge",
  loadMode: "lazy",
  ttlMs: 15 * 60 * 1000,
  load: () => ({
    key: "knowledge",
    data: {
      domains: [],
      documents: [],
      connected: false,
    },
    sources: [createStubSource("knowledge-loader")],
    priority: 50,
    loadMode: "lazy",
  }),
};
