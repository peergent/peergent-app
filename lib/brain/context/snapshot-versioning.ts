import { hashContextSlices } from "../providers/token-strategy";

export type SnapshotVersionMetadata = {
  version: number;
  createdAt: string;
  updatedAt: string;
  sourceHash: string;
  contextHash: string;
};

export function buildSnapshotVersionMetadata(input: {
  sourceKeys: readonly string[];
  contextKeys: readonly string[];
  createdAt: string;
  updatedAt?: string;
  version?: number;
}): SnapshotVersionMetadata {
  return {
    version: input.version ?? 1,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
    sourceHash: hashContextSlices(input.sourceKeys),
    contextHash: hashContextSlices(input.contextKeys),
  };
}

export function bumpSnapshotVersion(
  current: SnapshotVersionMetadata,
  sourceKeys: readonly string[],
  contextKeys: readonly string[],
  updatedAt: string
): SnapshotVersionMetadata {
  const sourceHash = hashContextSlices(sourceKeys);
  const contextHash = hashContextSlices(contextKeys);
  const unchanged =
    sourceHash === current.sourceHash && contextHash === current.contextHash;
  return {
    version: unchanged ? current.version : current.version + 1,
    createdAt: current.createdAt,
    updatedAt,
    sourceHash,
    contextHash,
  };
}
