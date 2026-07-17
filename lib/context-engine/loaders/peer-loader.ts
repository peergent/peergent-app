import type { PeerIdentitySlice } from "../types/peer";
import { createStubSource, type ContextLoader } from "./base";

export const peerLoader: ContextLoader<PeerIdentitySlice> = {
  key: "identity",
  layerKey: "identity",
  loadMode: "eager",
  ttlMs: 5 * 60 * 1000,
  load: ({ scope }) => ({
    key: "identity",
    data: {
      name: scope.peer.name,
      role: scope.peer.role,
      roleFocus: scope.peer.role,
      workingStyle: [],
    },
    sources: [createStubSource("peer-loader")],
    priority: 10,
    loadMode: "eager",
  }),
};

export const objectiveLoader: ContextLoader<{ objective: string; taskHint?: string }> = {
  key: "objective",
  layerKey: "objective",
  loadMode: "eager",
  ttlMs: 5 * 60 * 1000,
  load: ({ scope, taskHint }) => ({
    key: "objective",
    data: {
      objective: scope.peer.objective,
      taskHint,
    },
    sources: [createStubSource("objective-loader")],
    priority: 30,
    loadMode: "eager",
  }),
};
