import type { CompanyVersion } from "./types";

export function createCompanyVersion(input: {
  version: number;
  author: string;
  source: string;
  changeReason: string;
  at: string;
}): CompanyVersion {
  return {
    version: input.version,
    createdAt: input.at,
    updatedAt: input.at,
    author: input.author,
    source: input.source,
    changeReason: input.changeReason,
  };
}

export function nextCompanyVersion(prior?: number): number {
  return (prior ?? 0) + 1;
}

export function compareCompanyVersions(a: CompanyVersion, b: CompanyVersion): number {
  return a.version - b.version;
}
