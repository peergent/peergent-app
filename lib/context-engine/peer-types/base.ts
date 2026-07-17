import type { ContextBundle } from "../types";
import type { ContextLoader, LoaderContext } from "../loaders/base";
import type { PeerRole } from "../types/peer";
import { createStubSource } from "../loaders/base";

export type PeerTypeModule = {
  role: PeerRole;
  layerKeys: string[];
  loaders: ContextLoader<unknown>[];
  prioritize?: (bundle: ContextBundle) => ContextBundle;
};

export function createPeerTypeModule(
  role: PeerRole,
  focusAreas: string[]
): PeerTypeModule {
  const loader: ContextLoader<{ role: PeerRole; focusAreas: string[] }> = {
    key: "peer-type",
    layerKey: "peer-type",
    loadMode: "lazy",
    load: (_ctx: LoaderContext) => ({
      key: "peer-type",
      data: { role, focusAreas },
      sources: [createStubSource(`peer-type-${role.toLowerCase()}`)],
      priority: 45,
      loadMode: "lazy",
    }),
  };

  return {
    role,
    layerKeys: ["peer-type"],
    loaders: [loader],
  };
}
