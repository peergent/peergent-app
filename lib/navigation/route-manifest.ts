export type RouteClassification =
  | "CUSTOMER"
  | "PLATFORM_ADMIN"
  | "SHARED_PLATFORM"
  | "AUTH"
  | "DEVELOPMENT_ONLY"
  | "DESIGN_PREVIEW"
  | "LEGACY_OR_DUPLICATE";

export type RouteAudience =
  | "PUBLIC"
  | "AUTHENTICATED_CUSTOMER"
  | "PLATFORM_STAFF"
  | "DEVELOPER";

export type RouteAuthRequirement =
  | "NONE"
  | "AUTHENTICATED"
  | "ORGANIZATION_MEMBER"
  | "PLATFORM_ADMIN";

export type RouteCanonicalStatus =
  | "CANONICAL"
  | "ALIAS"
  | "LEGACY"
  | "PREVIEW_ONLY";

export type RouteEnvironment = "ALL" | "DEVELOPMENT_ONLY";

export type RouteManifestEntry = {
  id: string;
  path: string;
  classification: RouteClassification;
  audience: RouteAudience;
  authRequirement: RouteAuthRequirement;
  canonicalStatus: RouteCanonicalStatus;
  canonicalPath?: string;
  environment: RouteEnvironment;
  organizationScoped: boolean;
  description: string;
};

const ROUTE_MANIFEST: readonly RouteManifestEntry[] = [
  {
    id: "marketing.root",
    path: "/",
    classification: "CUSTOMER",
    audience: "PUBLIC",
    authRequirement: "NONE",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: false,
    description: "Public marketing landing; authenticated users route via post-login.",
  },
  {
    id: "customer.dashboard",
    path: "/dashboard",
    classification: "LEGACY_OR_DUPLICATE",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "ALIAS",
    canonicalPath: "/home",
    environment: "ALL",
    organizationScoped: true,
    description: "Legacy alias redirecting to Command Center at /home.",
  },
  {
    id: "customer.home",
    path: "/home",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Command Center morning surface.",
  },
  {
    id: "customer.hq",
    path: "/hq",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "HQ landing; default post-login destination today.",
  },
  {
    id: "customer.inbox",
    path: "/inbox",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Unified attention inbox for org peers and marketing snapshots.",
  },
  {
    id: "customer.team.index",
    path: "/team",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Team roster and peer entry (2.0 canonical peers list).",
  },
  {
    id: "customer.team.peer",
    path: "/team/[peerId]",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Marketing Peer Studio overview (canonical peer studio root).",
  },
  {
    id: "customer.team.work",
    path: "/team/[peerId]/work",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer studio work tab.",
  },
  {
    id: "customer.team.project",
    path: "/team/[peerId]/projects/[projectId]",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Marketing project detail within peer studio.",
  },
  {
    id: "customer.team.content.index",
    path: "/team/[peerId]/content",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer studio content list tab.",
  },
  {
    id: "customer.team.content.detail",
    path: "/team/[peerId]/content/[contentId]",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Content item detail and approval within peer studio.",
  },
  {
    id: "customer.team.responsibilities.index",
    path: "/team/[peerId]/responsibilities",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer responsibilities list tab.",
  },
  {
    id: "customer.team.responsibility.detail",
    path: "/team/[peerId]/responsibilities/[responsibilityId]",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Single responsibility detail within peer studio.",
  },
  {
    id: "customer.team.performance",
    path: "/team/[peerId]/performance",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer studio performance tab.",
  },
  {
    id: "customer.team.knowledge",
    path: "/team/[peerId]/knowledge",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer-scoped knowledge tab in studio.",
  },
  {
    id: "customer.team.connections",
    path: "/team/[peerId]/connections",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer studio connections tab.",
  },
  {
    id: "customer.team.automations",
    path: "/team/[peerId]/automations",
    classification: "LEGACY_OR_DUPLICATE",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "ALIAS",
    canonicalPath: "/team/[peerId]/responsibilities",
    environment: "ALL",
    organizationScoped: true,
    description: "Legacy redirect alias to responsibilities tab.",
  },
  {
    id: "customer.team.review",
    path: "/team/[peerId]/review",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer studio review tab with persistent review bar.",
  },
  {
    id: "customer.team.settings",
    path: "/team/[peerId]/settings",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Peer studio settings and autonomy policy.",
  },
  {
    id: "legacy.peers.index",
    path: "/peers",
    classification: "LEGACY_OR_DUPLICATE",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "ALIAS",
    canonicalPath: "/team",
    environment: "ALL",
    organizationScoped: true,
    description: "Legacy peers list redirect to /team.",
  },
  {
    id: "legacy.peers.workforce",
    path: "/peers/workforce",
    classification: "LEGACY_OR_DUPLICATE",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "LEGACY",
    canonicalPath: "/peers",
    environment: "ALL",
    organizationScoped: true,
    description: "Legacy workforce path; middleware redirects toward /peers then /team.",
  },
  {
    id: "legacy.peers.detail",
    path: "/peers/[id]",
    classification: "LEGACY_OR_DUPLICATE",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "LEGACY",
    canonicalPath: "/team/[peerId]",
    environment: "ALL",
    organizationScoped: true,
    description: "Legacy peer profile with mock-enriched sections; Marketing peers redirect to team studio.",
  },
  {
    id: "legacy.peers.marketing",
    path: "/peers/[id]/marketing",
    classification: "LEGACY_OR_DUPLICATE",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "ALIAS",
    canonicalPath: "/team/[peerId]",
    environment: "ALL",
    organizationScoped: true,
    description: "Legacy marketing entry redirecting to canonical peer studio.",
  },
  {
    id: "legacy.knowledge",
    path: "/knowledge",
    classification: "LEGACY_OR_DUPLICATE",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "ALIAS",
    canonicalPath: "/company",
    environment: "ALL",
    organizationScoped: true,
    description: "Legacy knowledge URL alias redirecting to company brain.",
  },
  {
    id: "customer.company",
    path: "/company",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Organization company DNA and knowledge management (canonical /knowledge successor).",
  },
  {
    id: "customer.integrations",
    path: "/integrations",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Org integrations placeholder and connection UI.",
  },
  {
    id: "customer.settings",
    path: "/settings",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "User/org settings including theme preferences.",
  },
  {
    id: "customer.website-intelligence",
    path: "/website-intelligence",
    classification: "CUSTOMER",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Website intelligence onboarding and assessment flow.",
  },
  {
    id: "auth.login",
    path: "/login",
    classification: "AUTH",
    audience: "PUBLIC",
    authRequirement: "NONE",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: false,
    description: "Supabase login.",
  },
  {
    id: "auth.signup",
    path: "/signup",
    classification: "AUTH",
    audience: "PUBLIC",
    authRequirement: "NONE",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: false,
    description: "Supabase signup and org provisioning.",
  },
  {
    id: "auth.forgot-password",
    path: "/forgot-password",
    classification: "AUTH",
    audience: "PUBLIC",
    authRequirement: "NONE",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: false,
    description: "Password reset request.",
  },
  {
    id: "auth.reset-password",
    path: "/reset-password",
    classification: "AUTH",
    audience: "PUBLIC",
    authRequirement: "NONE",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: false,
    description: "Password reset completion.",
  },
  {
    id: "auth.callback",
    path: "/auth/callback",
    classification: "AUTH",
    audience: "PUBLIC",
    authRequirement: "NONE",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: false,
    description: "OAuth and email auth callback route handler.",
  },
  {
    id: "auth.post-login",
    path: "/auth/post-login",
    classification: "AUTH",
    audience: "AUTHENTICATED_CUSTOMER",
    authRequirement: "AUTHENTICATED",
    canonicalStatus: "CANONICAL",
    environment: "ALL",
    organizationScoped: true,
    description: "Post-authentication routing (peers count → HQ or onboarding).",
  },
  {
    id: "dev.context",
    path: "/dev/context",
    classification: "DEVELOPMENT_ONLY",
    audience: "DEVELOPER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "DEVELOPMENT_ONLY",
    organizationScoped: true,
    description: "Context engine inspection playground (not available in production).",
  },
  {
    id: "dev.prompt",
    path: "/dev/prompt",
    classification: "DEVELOPMENT_ONLY",
    audience: "DEVELOPER",
    authRequirement: "ORGANIZATION_MEMBER",
    canonicalStatus: "CANONICAL",
    environment: "DEVELOPMENT_ONLY",
    organizationScoped: true,
    description: "Prompt and AI response playground exposing internal packages (dev only).",
  },
  {
    id: "design-preview.wildcard",
    path: "/design-preview/*",
    classification: "DESIGN_PREVIEW",
    audience: "DEVELOPER",
    authRequirement: "NONE",
    canonicalStatus: "PREVIEW_ONLY",
    environment: "DEVELOPMENT_ONLY",
    organizationScoped: false,
    description: "Static HQ and concept design previews (hq, hq-a–hq-d); blocked in production middleware.",
  },
  {
    id: "preview.studio-shell",
    path: "/studio-shell-preview",
    classification: "DESIGN_PREVIEW",
    audience: "DEVELOPER",
    authRequirement: "NONE",
    canonicalStatus: "PREVIEW_ONLY",
    environment: "DEVELOPMENT_ONLY",
    organizationScoped: false,
    description: "Peer studio shell component preview; dev guard and middleware.",
  },
] as const;

export type RouteMatch = {
  entry: RouteManifestEntry;
  params: Record<string, string>;
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function isWildcardTemplate(path: string): boolean {
  return path.endsWith("/*");
}

function wildcardPrefix(path: string): string {
  return path.slice(0, -2);
}

function templateSegmentCount(path: string): number {
  if (isWildcardTemplate(path)) {
    return path.split("/").filter(Boolean).length + 1;
  }
  return path.split("/").filter(Boolean).length;
}

function staticSegmentScore(path: string): number {
  return path.split("/").filter((segment) => segment && !segment.startsWith("[")).length;
}

function matchTemplate(
  template: string,
  pathname: string
): Record<string, string> | null {
  if (isWildcardTemplate(template)) {
    const prefix = wildcardPrefix(template);
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return {};
    }
    return null;
  }

  const templateParts = template.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (templateParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < templateParts.length; i += 1) {
    const templatePart = templateParts[i];
    const pathPart = pathParts[i];

    if (templatePart.startsWith("[") && templatePart.endsWith("]")) {
      const paramName = templatePart.slice(1, -1);
      if (!pathPart) {
        return null;
      }
      params[paramName] = decodeURIComponent(pathPart);
      continue;
    }

    if (templatePart !== pathPart) {
      return null;
    }
  }

  return params;
}

function compareMatchSpecificity(a: RouteManifestEntry, b: RouteManifestEntry): number {
  const segmentDiff =
    templateSegmentCount(b.path) - templateSegmentCount(a.path);
  if (segmentDiff !== 0) {
    return segmentDiff;
  }

  const staticDiff = staticSegmentScore(b.path) - staticSegmentScore(a.path);
  if (staticDiff !== 0) {
    return staticDiff;
  }

  if (isWildcardTemplate(a.path) && !isWildcardTemplate(b.path)) {
    return 1;
  }
  if (isWildcardTemplate(b.path) && !isWildcardTemplate(a.path)) {
    return -1;
  }

  return 0;
}

function findBestMatch(pathname: string): RouteMatch | undefined {
  const normalized = normalizePathname(pathname);
  let best: RouteMatch | undefined;

  for (const entry of ROUTE_MANIFEST) {
    const params = matchTemplate(entry.path, normalized);
    if (params === null) {
      continue;
    }

    const candidate: RouteMatch = { entry, params };
    if (!best || compareMatchSpecificity(candidate.entry, best.entry) < 0) {
      best = candidate;
    }
  }

  return best;
}

function resolveParamValue(
  paramName: string,
  params: Record<string, string>
): string | undefined {
  if (params[paramName] !== undefined) {
    return params[paramName];
  }
  if (paramName === "peerId" && params.id !== undefined) {
    return params.id;
  }
  if (paramName === "id" && params.peerId !== undefined) {
    return params.peerId;
  }
  return undefined;
}

function materializePath(
  template: string,
  params: Record<string, string>
): string {
  if (isWildcardTemplate(template)) {
    return template;
  }

  const parts = template.split("/").filter(Boolean);
  const resolved = parts.map((part) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      const name = part.slice(1, -1);
      const value = resolveParamValue(name, params);
      if (value === undefined) {
        throw new Error(`Missing route param "${name}" for template ${template}`);
      }
      return encodeURIComponent(value);
    }
    return part;
  });

  return `/${resolved.join("/")}`;
}

export function getRouteManifest(): readonly RouteManifestEntry[] {
  return ROUTE_MANIFEST;
}

export function getRouteById(id: string): RouteManifestEntry | undefined {
  return ROUTE_MANIFEST.find((entry) => entry.id === id);
}

export function getRouteByPath(pathname: string): RouteManifestEntry | undefined {
  return findBestMatch(pathname)?.entry;
}

export function matchRoute(pathname: string): RouteMatch | undefined {
  return findBestMatch(pathname);
}

export function getCanonicalRoute(pathname: string): RouteManifestEntry | undefined {
  const match = findBestMatch(pathname);
  if (!match) {
    return undefined;
  }

  const { entry, params } = match;

  if (
    entry.canonicalStatus === "CANONICAL" ||
    entry.canonicalStatus === "PREVIEW_ONLY" ||
    !entry.canonicalPath
  ) {
    return entry;
  }

  const canonicalPathname = materializePath(entry.canonicalPath, params);
  return getRouteByPath(canonicalPathname);
}

export function isDevelopmentOnlyRoute(pathname: string): boolean {
  const entry = getRouteByPath(pathname);
  if (!entry) {
    return false;
  }

  return (
    entry.environment === "DEVELOPMENT_ONLY" ||
    entry.classification === "DEVELOPMENT_ONLY" ||
    entry.classification === "DESIGN_PREVIEW"
  );
}

export function isCustomerRoute(pathname: string): boolean {
  const entry = getRouteByPath(pathname);
  if (!entry) {
    return false;
  }

  return (
    entry.classification === "CUSTOMER" ||
    entry.classification === "LEGACY_OR_DUPLICATE"
  );
}

export function isLegacyRoute(pathname: string): boolean {
  const entry = getRouteByPath(pathname);
  if (!entry) {
    return false;
  }

  return (
    entry.canonicalStatus === "LEGACY" ||
    entry.canonicalStatus === "ALIAS" ||
    entry.classification === "LEGACY_OR_DUPLICATE"
  );
}
