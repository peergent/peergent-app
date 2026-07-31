import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import { DEMO_PEER_ID, demoResponsibilities } from "./demo-company";

/**
 * In-memory state for the Demo Workspace.
 *
 * A prospect must be able to *use* the working agreement — move a boundary,
 * see the confirmation, see it hold while they look around — because that
 * interaction is the product. But none of it may reach a real workspace.
 *
 * The isolation is structural rather than conventional:
 *
 * - this module never imports the workspace repository, the Supabase client or
 *   `patchMarketingWorkspaceState`. There is no code path from here to storage,
 *   so a demo write cannot become a production write by mistake;
 * - every mutation takes a peer id and rejects any value other than the demo
 *   one, so a live peer can never enter this path even if a caller confuses
 *   the two;
 * - state lives in a module-scoped variable. It survives client-side
 *   navigation between Office destinations, and dies on reload — which is
 *   exactly the lifetime a showcase should have.
 *
 * Read through `useSyncExternalStore`: the snapshot is reference-stable between
 * mutations, so React can subscribe without re-rendering on every read.
 */

/** Raised when something tries to route a real workspace through the demo. */
export class DemoIsolationError extends Error {
  constructor(peerId: string) {
    super(
      `Refused to write "${peerId}" through the demo store. ` +
        `Only "${DEMO_PEER_ID}" may use this path.`
    );
    this.name = "DemoIsolationError";
  }
}

function assertDemoPeer(peerId: string): void {
  if (peerId !== DEMO_PEER_ID) throw new DemoIsolationError(peerId);
}

type Listener = () => void;

const listeners = new Set<Listener>();

/** The canonical Veldwerk configuration a reset returns to. */
const defaults: MarketingResponsibility[] = demoResponsibilities();

let current: MarketingResponsibility[] = defaults;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeDemoWorkspace(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reference-stable between mutations. `useSyncExternalStore` compares
 * snapshots by identity, so returning a fresh array here would loop.
 */
export function getDemoResponsibilities(): MarketingResponsibility[] {
  return current;
}

/** The server has no demo session; render the canonical state. */
export function getDemoResponsibilitiesServerSnapshot(): MarketingResponsibility[] {
  return defaults;
}

export function setDemoResponsibilities(
  peerId: string,
  next: MarketingResponsibility[]
): void {
  assertDemoPeer(peerId);
  current = next;
  emit();
}

/** True once anything has been changed, so the UI can offer a reset. */
export function isDemoWorkspaceModified(): boolean {
  return current !== defaults;
}

/** Restores the canonical Veldwerk defaults. */
export function resetDemoWorkspace(): void {
  if (current === defaults) return;
  current = defaults;
  emit();
}
