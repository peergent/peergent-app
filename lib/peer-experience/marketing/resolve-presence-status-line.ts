import type { NowViewModel } from "../types";

/** @deprecated Prefer `now.presenceLine` from the view model. */
export function resolvePresenceStatusLine(now: NowViewModel): string {
  return now.presenceLine;
}
