import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { AgreementKnowledge } from "@/lib/office/agreement/types";
import type { KnowledgeAmendments } from "@/lib/office/agreement/build-marketing-agreement";
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

const emptyKnowledgeAmendments: KnowledgeAmendments = {
  overrides: {},
  additions: [],
};

let current: MarketingResponsibility[] = defaults;
let knowledgeAmendments: KnowledgeAmendments = emptyKnowledgeAmendments;

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

export function getDemoKnowledgeAmendments(): KnowledgeAmendments {
  return knowledgeAmendments;
}

export function getDemoKnowledgeAmendmentsServerSnapshot(): KnowledgeAmendments {
  return emptyKnowledgeAmendments;
}

export function setDemoKnowledgeOverride(
  peerId: string,
  knowledgeId: string,
  value: string,
  correctedBy: string
): void {
  assertDemoPeer(peerId);
  knowledgeAmendments = {
    ...knowledgeAmendments,
    overrides: {
      ...knowledgeAmendments.overrides,
      [knowledgeId]: { value, correctedBy },
    },
  };
  emit();
}

export function addDemoCustomerKnowledge(
  peerId: string,
  entry: AgreementKnowledge
): void {
  assertDemoPeer(peerId);
  if (entry.provenance !== "customer_rule") {
    throw new Error("Demo additions must be customer_rule provenance.");
  }
  knowledgeAmendments = {
    ...knowledgeAmendments,
    additions: [...knowledgeAmendments.additions, entry],
  };
  emit();
}

export function removeDemoCustomerKnowledge(peerId: string, knowledgeId: string): void {
  assertDemoPeer(peerId);
  const restOverrides = { ...knowledgeAmendments.overrides };
  delete restOverrides[knowledgeId];
  knowledgeAmendments = {
    overrides: restOverrides,
    additions: knowledgeAmendments.additions.filter((entry) => entry.id !== knowledgeId),
  };
  emit();
}

function knowledgeIsModified(): boolean {
  return (
    Object.keys(knowledgeAmendments.overrides).length > 0 ||
    knowledgeAmendments.additions.length > 0
  );
}

/** True once anything has been changed, so the UI can offer a reset. */
export function isDemoWorkspaceModified(): boolean {
  return current !== defaults || knowledgeIsModified();
}

/** Restores the canonical Veldwerk defaults. */
export function resetDemoWorkspace(): void {
  if (current === defaults && !knowledgeIsModified()) return;
  current = defaults;
  knowledgeAmendments = emptyKnowledgeAmendments;
  emit();
}
