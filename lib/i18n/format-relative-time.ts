import type { HomeCopy } from "./home-copy";

/** Relative activity timestamps for home surfaces (shared with PgRecentMovement). */
export function formatHomeRelativeTime(iso: string, copy: HomeCopy): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return copy.ui.relativeJustNow;
    if (hours < 24) return copy.ui.relativeHoursAgo(hours);
    const days = Math.floor(hours / 24);
    if (days === 1) return copy.ui.relativeYesterday;
    return copy.ui.relativeDaysAgo(days);
  } catch {
    return "";
  }
}
