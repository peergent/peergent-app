/** Marketing peer workspace entry — Peer Studio at /team/[peerId]. */
export function peerStudioHref(peerId: string): string {
  return `/team/${peerId}`;
}

export function marketingPeerWorkspaceHref(peerId: string): string {
  return peerStudioHref(peerId);
}

/** @deprecated Use peerStudioHref — legacy path redirects to Studio. */
export function legacyMarketingWorkspaceHref(peerId: string): string {
  return `/peers/${peerId}/marketing`;
}
