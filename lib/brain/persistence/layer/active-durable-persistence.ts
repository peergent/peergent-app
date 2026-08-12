/**
 * Process-scoped active durable persistence port — set by server composition root or tests.
 */

import type { DurablePersistencePort } from "./durable-persistence-port";

let activeDurable: DurablePersistencePort | null = null;

export function getActiveDurablePersistence(): DurablePersistencePort | null {
  return activeDurable;
}

export function setActiveDurablePersistence(port: DurablePersistencePort | null): void {
  activeDurable = port;
}

export function resetActiveDurablePersistence(): void {
  activeDurable = null;
}
