import {
  customerNavigationItems,
  customerNavigationSections,
  isVisibleNavigationItem,
  type NavigationBadgeMetadata,
  type NavigationIconKey,
  type NavigationItem,
  type NavigationSectionId,
  type NavigationVisibility,
} from "@/lib/navigation/customer-navigation";
import { getCanonicalRoute } from "@/lib/navigation/route-manifest";

export type NavigationViewItem = {
  id: string;
  label: string;
  href: string;
  iconKey: NavigationIconKey;
  description: string;
  section: NavigationSectionId;
  visibility: NavigationVisibility;
  organizationScoped: boolean;
  badge?: NavigationBadgeMetadata;
};

export type NavigationViewSection = {
  section: (typeof customerNavigationSections)[number];
  items: readonly NavigationViewItem[];
};

export type NavigationActiveState = {
  itemId: string;
  href: string;
  matchedPath: string;
  canonicalHref: string;
};

export type BuildCustomerNavigationViewOptions = {
  includeHidden?: boolean;
};

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function toViewItem(item: NavigationItem): NavigationViewItem {
  return {
    id: item.id,
    label: item.label,
    href: item.href,
    iconKey: item.iconKey,
    description: item.description,
    section: item.section,
    visibility: item.visibility,
    organizationScoped: item.organizationScoped,
    badge: item.badge,
  };
}

function eligibleItems(includeHidden: boolean): readonly NavigationItem[] {
  if (includeHidden) {
    return customerNavigationItems;
  }
  return customerNavigationItems.filter(isVisibleNavigationItem);
}

function matchesLegacyAlias(item: NavigationItem, pathname: string): boolean {
  return (
    item.legacyHrefAliases?.some(
      (alias) => pathname === alias || pathname.startsWith(`${alias}/`)
    ) ?? false
  );
}

function pathMatchesNavItem(pathname: string, item: NavigationItem): boolean {
  if (item.href === "/home") {
    return pathname === "/home";
  }
  if (item.href === "/hq") {
    return pathname === "/hq";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function buildActiveState(
  item: NavigationItem,
  matchedPath: string,
  canonicalHref?: string
): NavigationActiveState {
  const canonical =
    canonicalHref ?? getCanonicalRoute(item.href)?.path ?? item.href;
  return {
    itemId: item.id,
    href: item.href,
    matchedPath,
    canonicalHref: canonical.includes("[") ? item.href : canonical,
  };
}

export function buildCustomerNavigationView(
  options: BuildCustomerNavigationViewOptions = {}
): readonly NavigationViewItem[] {
  const includeHidden = options.includeHidden ?? false;
  return eligibleItems(includeHidden).map(toViewItem);
}

export function resolveNavigationHref(pathname: string): string | undefined {
  return resolveActiveNavigationItem(pathname)?.href;
}

export function resolveActiveNavigationItem(
  pathname: string,
  options: BuildCustomerNavigationViewOptions = {}
): NavigationActiveState | undefined {
  const normalized = normalizePathname(pathname);
  const items = eligibleItems(options.includeHidden ?? false);

  for (const item of items) {
    if (matchesLegacyAlias(item, normalized)) {
      return buildActiveState(item, normalized);
    }
  }

  const canonicalRoute = getCanonicalRoute(normalized);
  if (canonicalRoute && !canonicalRoute.path.includes("[")) {
    const owner = items.find((item) => item.href === canonicalRoute.path);
    if (owner) {
      return buildActiveState(owner, normalized, canonicalRoute.path);
    }
  }

  for (const item of items) {
    if (pathMatchesNavItem(normalized, item)) {
      return buildActiveState(item, normalized);
    }
  }

  return undefined;
}

export function groupNavigationBySection(
  items: readonly NavigationViewItem[] = buildCustomerNavigationView()
): readonly NavigationViewSection[] {
  const sortedSections = [...customerNavigationSections].sort(
    (a, b) => a.order - b.order
  );

  return sortedSections.map((section) => ({
    section,
    items: items.filter((item) => item.section === section.id),
  }));
}

export function getVisibleCanonicalDestinationKeys(
  items: readonly NavigationViewItem[] = buildCustomerNavigationView()
): string[] {
  return items.map((item) => {
    const canonical = getCanonicalRoute(item.href);
    return canonical?.id ?? item.href;
  });
}
