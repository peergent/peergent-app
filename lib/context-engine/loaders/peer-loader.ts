import { toPeerRole } from "../data/peer-role";
import { fetchPeerForContext } from "../data/queries";
import { createSupabaseSource } from "../data/sources";
import type { PeerIdentitySlice } from "../types/peer";
import { createStubSource, type ContextLoader, type LoaderContext } from "./base";

function identityFromScope(scope: LoaderContext["scope"]): PeerIdentitySlice {
  return {
    name: scope.peer.name,
    role: scope.peer.role,
    roleFocus: scope.peer.role,
    workingStyle: [],
  };
}

export const peerLoader: ContextLoader<PeerIdentitySlice> = {
  key: "identity",
  layerKey: "identity",
  loadMode: "eager",
  ttlMs: 5 * 60 * 1000,
  load: async ({ scope, supabase }) => {
    if (!supabase) {
      return {
        key: "identity",
        data: identityFromScope(scope),
        sources: [createStubSource("peer-loader")],
        priority: 10,
        loadMode: "eager",
      };
    }

    const peer = await fetchPeerForContext(
      supabase,
      scope.peer.peerId,
      scope.organization.organizationId
    );

    if (!peer) {
      return {
        key: "identity",
        data: identityFromScope(scope),
        sources: [createStubSource("peer-loader-fallback")],
        priority: 10,
        loadMode: "eager",
      };
    }

    const role = toPeerRole(peer.role);

    return {
      key: "identity",
      data: {
        name: peer.name,
        role,
        roleFocus: role,
        workingStyle: [],
      },
      sources: [createSupabaseSource("peers", peer.id, peer.name)],
      priority: 10,
      loadMode: "eager",
    };
  },
};

export const objectiveLoader: ContextLoader<{ objective: string; taskHint?: string }> = {
  key: "objective",
  layerKey: "objective",
  loadMode: "eager",
  ttlMs: 5 * 60 * 1000,
  load: async ({ scope, taskHint, supabase }) => {
    if (!supabase) {
      return {
        key: "objective",
        data: {
          objective: scope.peer.objective,
          taskHint,
        },
        sources: [createStubSource("objective-loader")],
        priority: 30,
        loadMode: "eager",
      };
    }

    const peer = await fetchPeerForContext(
      supabase,
      scope.peer.peerId,
      scope.organization.organizationId
    );

    if (!peer) {
      return {
        key: "objective",
        data: {
          objective: scope.peer.objective,
          taskHint,
        },
        sources: [createStubSource("objective-loader-fallback")],
        priority: 30,
        loadMode: "eager",
      };
    }

    return {
      key: "objective",
      data: {
        objective: peer.objective,
        taskHint,
      },
      sources: [
        createSupabaseSource("peers", peer.id, `${peer.name} objective`),
      ],
      priority: 30,
      loadMode: "eager",
    };
  },
};
