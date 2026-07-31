import {
  officeDestinationHref,
  type OfficeDestinationId,
} from "./destinations";

/**
 * The Office link boundary.
 *
 * Every href rendered inside `/office/[peerId]` must pass through here. The
 * domain adapters legitimately reuse marketing link helpers, but those resolve
 * to `/team/...` — the legacy surface. Without this boundary a decision card or
 * a campaign row silently ejects the customer out of the Office.
 *
 * `toOfficeHref` is total: anything it cannot map degrades to the Peer's Desk.
 * There is no input that produces a link outside `/office/`.
 */

export function officeHref(
  peerId: string,
  destination: OfficeDestinationId,
  params?: Record<string, string | null | undefined>
): string {
  const base = officeDestinationHref(peerId, destination);
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

/** Splits a href into its path and search parts, tolerating absolute URLs. */
function splitHref(href: string): { path: string; search: string } {
  const withoutOrigin = href.replace(/^https?:\/\/[^/]+/i, "");
  const [path = "", search = ""] = withoutOrigin.split("?");
  return { path, search };
}

/**
 * Rewrites any href produced outside the Office into its nearest Office
 * destination.
 *
 * Deep legacy routes (project detail, review item, knowledge) have no Office
 * equivalent yet, so they degrade to the destination that owns that concept
 * rather than opening a legacy page.
 */
export function toOfficeHref(peerId: string, href: string | null | undefined): string {
  const desk = officeHref(peerId, "desk");
  if (!href) return desk;

  const { path, search } = splitHref(href);

  // Already inside the Office — pass through untouched.
  if (path.startsWith("/office/")) return href;

  const segments = path.split("/").filter(Boolean);

  // Anything not addressed at a peer (e.g. `/integrations`) belongs to the
  // working agreement, which is where access is managed.
  if (segments[0] !== "team") {
    if (segments[0] === "integrations") return officeHref(peerId, "agreement");
    return desk;
  }

  // `/team/:peerId/...` — the trailing segments decide the destination.
  const rest = segments.slice(2);
  if (rest.length === 0) return desk;

  const [first, , third] = rest;

  switch (first) {
    case "projects":
      // A review item is a decision; it opens where decisions are reviewed.
      return third === "review"
        ? officeHref(peerId, "content", { state: "awaiting_review" })
        : officeHref(peerId, "work");

    case "work":
      return officeHref(peerId, "work");

    case "content":
      return officeHref(peerId, "content");

    case "results":
    case "performance":
      return officeHref(peerId, "performance");

    // Decision and completion surfaces all live on the Desk.
    case "waiting":
    case "review":
    case "done":
      return desk;

    // Everything about boundaries, knowledge and access is one room.
    case "settings":
    case "connections":
    case "knowledge":
    case "responsibilities":
    case "automations":
      return officeHref(peerId, "agreement");

    default:
      return desk;
  }
  // `search` is intentionally dropped: legacy params address legacy surfaces.
  void search;
}

/** True when a href is safely inside the Office. Used by tests and guards. */
export function isOfficeHref(href: string): boolean {
  return href.startsWith("/office/");
}
