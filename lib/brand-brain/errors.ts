export class BrandBrainInvalidOrganizationIdError extends Error {
  readonly code = "BRAND_BRAIN_INVALID_ORGANIZATION_ID" as const;

  constructor(message = "A non-empty organization id is required.") {
    super(message);
    this.name = "BrandBrainInvalidOrganizationIdError";
  }
}

export class BrandBrainOrganizationNotFoundError extends Error {
  readonly code = "BRAND_BRAIN_ORGANIZATION_NOT_FOUND" as const;

  constructor(organizationId: string) {
    super(`Organization ${organizationId} was not found or is not accessible.`);
    this.name = "BrandBrainOrganizationNotFoundError";
  }
}

export class BrandBrainSourceLoadError extends Error {
  readonly code = "BRAND_BRAIN_SOURCE_LOAD_FAILED" as const;
  readonly source: string;
  readonly organizationId: string;

  constructor(source: string, organizationId: string, cause?: unknown) {
    super(`Failed to load ${source} for organization ${organizationId}.`);
    this.name = "BrandBrainSourceLoadError";
    this.source = source;
    this.organizationId = organizationId;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export class BrandProfileOrganizationMismatchError extends Error {
  readonly code = "BRAND_PROFILE_ORGANIZATION_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "BrandProfileOrganizationMismatchError";
  }
}
