import {
  getCanonicalRoute,
  getRouteById,
  type RouteManifestEntry,
} from "@/lib/navigation/route-manifest";

export type NavigationSectionId =
  | "OPERATE"
  | "WORKFORCE"
  | "ORGANIZATION"
  | "SYSTEM";

export type NavigationVisibility = "PRIMARY" | "SECONDARY" | "HIDDEN";

export type NavigationIconKey =
  | "home"
  | "hq"
  | "inbox"
  | "users"
  | "building"
  | "book-open"
  | "library"
  | "plug"
  | "settings";

export type NavigationBadgeKind = "count";

export type NavigationBadgeMetadata = {
  kind: NavigationBadgeKind;
  /** Identifies which app metric feeds the badge (e.g. inbox attention count). */
  sourceKey: string;
};

export type NavigationSection = {
  id: NavigationSectionId;
  label: string;
  order: number;
};

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  iconKey: NavigationIconKey;
  description: string;
  section: NavigationSectionId;
  routeId: string;
  organizationScoped: boolean;
  visibility: NavigationVisibility;
  badge?: NavigationBadgeMetadata;
  /** Legacy URLs that should resolve active state to this item when nav is wired. */
  legacyHrefAliases?: readonly string[];
};

/** Canonical customer shell destinations (navigation source of truth). */
export const CANONICAL_CUSTOMER_NAV_HREFS = [
  "/home",
  "/hq",
  "/inbox",
  "/team",
  "/company",
  "/knowledge",
  "/integrations",
  "/settings",
] as const;

export type CanonicalCustomerNavHref =
  (typeof CANONICAL_CUSTOMER_NAV_HREFS)[number];

const FORBIDDEN_NAV_HREF_PREFIXES = [
  "/dashboard",
  "/peers",
  "/design-preview",
  "/dev",
  "/studio-shell-preview",
] as const;

export const customerNavigationSections: readonly NavigationSection[] = [
  { id: "OPERATE", label: "Operate", order: 1 },
  { id: "WORKFORCE", label: "Workforce", order: 2 },
  { id: "ORGANIZATION", label: "Organization", order: 3 },
  { id: "SYSTEM", label: "System", order: 4 },
] as const;

export const customerNavigationItems: readonly NavigationItem[] = [
  {
    id: "nav.home",
    label: "Command Center",
    href: "/home",
    iconKey: "home",
    description: "Daily command center and executive briefing.",
    section: "OPERATE",
    routeId: "customer.home",
    organizationScoped: true,
    visibility: "PRIMARY",
    legacyHrefAliases: ["/dashboard"],
  },
  {
    id: "nav.hq",
    label: "HQ",
    href: "/hq",
    iconKey: "hq",
    description: "Organization-wide operating overview.",
    section: "OPERATE",
    routeId: "customer.hq",
    organizationScoped: true,
    visibility: "SECONDARY",
  },
  {
    id: "nav.inbox",
    label: "Inbox",
    href: "/inbox",
    iconKey: "inbox",
    description: "Attention, approvals, and decisions.",
    section: "OPERATE",
    routeId: "customer.inbox",
    organizationScoped: true,
    visibility: "PRIMARY",
    badge: { kind: "count", sourceKey: "inbox" },
  },
  {
    id: "nav.team",
    label: "Team",
    href: "/team",
    iconKey: "users",
    description: "Digital workforce and peer access.",
    section: "WORKFORCE",
    routeId: "customer.team.index",
    organizationScoped: true,
    visibility: "PRIMARY",
    legacyHrefAliases: ["/peers"],
  },
  {
    id: "nav.company",
    label: "Company",
    href: "/company",
    iconKey: "building",
    description: "Organization profile and business context.",
    section: "ORGANIZATION",
    routeId: "customer.company",
    organizationScoped: true,
    visibility: "SECONDARY",
  },
  {
    id: "nav.knowledge",
    label: "Knowledge",
    href: "/knowledge",
    iconKey: "library",
    description: "Knowledge sources and Business Brain management.",
    section: "ORGANIZATION",
    routeId: "legacy.knowledge",
    organizationScoped: true,
    // Hidden until /knowledge is a separate canonical surface. It currently redirects to
    // /company (route-manifest ALIAS); showing it alongside Company would duplicate one destination.
    visibility: "HIDDEN",
  },
  {
    id: "nav.integrations",
    label: "Integrations",
    href: "/integrations",
    iconKey: "plug",
    description: "Connected tools and channels.",
    section: "SYSTEM",
    routeId: "customer.integrations",
    organizationScoped: true,
    visibility: "SECONDARY",
  },
  {
    id: "nav.settings",
    label: "Settings",
    href: "/settings",
    iconKey: "settings",
    description: "Organization and account settings.",
    section: "SYSTEM",
    routeId: "customer.settings",
    organizationScoped: true,
    visibility: "SECONDARY",
  },
] as const;

function isForbiddenNavHref(href: string): boolean {
  return FORBIDDEN_NAV_HREF_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`)
  );
}

function isDevelopmentOrPreviewRoute(route: RouteManifestEntry): boolean {
  return (
    route.environment === "DEVELOPMENT_ONLY" ||
    route.classification === "DEVELOPMENT_ONLY" ||
    route.classification === "DESIGN_PREVIEW"
  );
}

function isCanonicalNavHref(href: string): href is CanonicalCustomerNavHref {
  return (CANONICAL_CUSTOMER_NAV_HREFS as readonly string[]).includes(href);
}

export function getCustomerNavigationItem(id: string): NavigationItem | undefined {
  return customerNavigationItems.find((item) => item.id === id);
}

export function getNavigationItemByHref(href: string): NavigationItem | undefined {
  const normalized = href.replace(/\/+$/, "") || "/";
  const direct = customerNavigationItems.find((item) => item.href === normalized);
  if (direct) {
    return direct;
  }
  return customerNavigationItems.find((item) =>
    item.legacyHrefAliases?.some(
      (alias) => normalized === alias || normalized.startsWith(`${alias}/`)
    )
  );
}

export function getPrimaryCustomerNavigation(): readonly NavigationItem[] {
  return customerNavigationItems.filter((item) => item.visibility === "PRIMARY");
}

export function isVisibleNavigationItem(item: NavigationItem): boolean {
  return item.visibility === "PRIMARY" || item.visibility === "SECONDARY";
}

function canonicalRouteKeyForNavHref(href: string): string | undefined {
  const canonical = getCanonicalRoute(href);
  if (!canonical) {
    return undefined;
  }
  return canonical.id;
}

/** Detects visible nav items that share the same route-manifest canonical destination. */
export function findVisibleCanonicalRouteCollisions(
  items: readonly NavigationItem[] = customerNavigationItems
): string[] {
  const errors: string[] = [];
  const visibleItems = items.filter(isVisibleNavigationItem);
  const buckets = new Map<string, NavigationItem[]>();

  for (const item of visibleItems) {
    const key = canonicalRouteKeyForNavHref(item.href);
    if (!key) {
      errors.push(
        `Visible navigation item ${item.id} (${item.href}) does not resolve to a route-manifest entry.`
      );
      continue;
    }
    const group = buckets.get(key) ?? [];
    group.push(item);
    buckets.set(key, group);
  }

  for (const [canonicalRouteId, group] of buckets) {
    if (group.length <= 1) {
      continue;
    }
    const labels = group
      .map((item) => `${item.id} (${item.href})`)
      .join(", ");
    const canonical = getRouteById(canonicalRouteId);
    const destination = canonical?.path ?? canonicalRouteId;
    errors.push(
      `Visible navigation items share canonical route "${canonicalRouteId}" (${destination}): ${labels}.`
    );
  }

  return errors;
}

export function validateCustomerNavigation(): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();

  for (const item of customerNavigationItems) {
    if (seenIds.has(item.id)) {
      errors.push(`Duplicate navigation item id: ${item.id}`);
    }
    seenIds.add(item.id);

    if (seenHrefs.has(item.href)) {
      errors.push(`Duplicate navigation href: ${item.href}`);
    }
    seenHrefs.add(item.href);

    if (!isCanonicalNavHref(item.href)) {
      errors.push(
        `Href ${item.href} is not a canonical customer navigation route.`
      );
    }

    if (isForbiddenNavHref(item.href)) {
      errors.push(`Forbidden navigation href: ${item.href}`);
    }

    for (const alias of item.legacyHrefAliases ?? []) {
      if (customerNavigationItems.some((entry) => entry.href === alias)) {
        errors.push(
          `Legacy alias ${alias} on ${item.id} must not duplicate a canonical nav href.`
        );
      }
      if (
        alias.startsWith("/dev/") ||
        alias === "/dev" ||
        alias.startsWith("/design-preview") ||
        alias === "/studio-shell-preview"
      ) {
        errors.push(
          `Legacy alias ${alias} on ${item.id} must not reference dev or preview routes.`
        );
      }
    }

    const route = getRouteById(item.routeId);
    if (!route) {
      errors.push(`Unknown routeId "${item.routeId}" for item ${item.id}.`);
      continue;
    }

    if (route.path !== item.href) {
      errors.push(
        `Href ${item.href} on ${item.id} does not match manifest path ${route.path} for routeId ${item.routeId}.`
      );
    }

    if (isDevelopmentOrPreviewRoute(route)) {
      errors.push(
        `Route ${item.routeId} for ${item.id} is development or design-preview only.`
      );
    }

    if (route.classification === "AUTH" || route.classification === "PLATFORM_ADMIN") {
      errors.push(
        `Route ${item.routeId} for ${item.id} is not a customer navigation target.`
      );
    }

    if (isForbiddenNavHref(route.path)) {
      errors.push(
        `Manifest path ${route.path} for ${item.id} is excluded from customer navigation.`
      );
    }

    if (
      route.canonicalStatus === "LEGACY" ||
      route.canonicalStatus === "PREVIEW_ONLY"
    ) {
      errors.push(
        `Route ${item.routeId} for ${item.id} uses non-canonical manifest status ${route.canonicalStatus}.`
      );
    }

    if (item.organizationScoped !== route.organizationScoped) {
      errors.push(
        `organizationScoped mismatch for ${item.id}: nav ${item.organizationScoped}, manifest ${route.organizationScoped}.`
      );
    }

    const section = customerNavigationSections.find(
      (entry) => entry.id === item.section
    );
    if (!section) {
      errors.push(`Unknown navigation section ${item.section} on ${item.id}.`);
    }
  }

  for (const href of CANONICAL_CUSTOMER_NAV_HREFS) {
    if (!customerNavigationItems.some((item) => item.href === href)) {
      errors.push(`Missing navigation item for canonical href ${href}.`);
    }
  }

  errors.push(...findVisibleCanonicalRouteCollisions());

  return errors;
}
