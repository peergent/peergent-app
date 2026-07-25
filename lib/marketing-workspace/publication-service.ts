import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import {
  defaultPublicationOrchestrator,
  type PublicationPackage,
} from "@/lib/peer-workflow";

export function prepareDraftForPublication(
  draft: MarketingContentDraft
): PublicationPackage {
  return defaultPublicationOrchestrator.preparePublication({
    draftId: draft.id,
    activityReference: draft.planActivityReference,
    contentType: draft.contentType,
    channel: draft.channel,
    title: draft.title,
    body: draft.body,
    callToAction: draft.callToAction,
    keywords: draft.keywords,
    objective: draft.objective,
    targetAudience: draft.targetAudience,
  });
}

export function markPublicationPackagePublished(
  pkg: PublicationPackage
): PublicationPackage {
  return defaultPublicationOrchestrator.markPublished(pkg);
}

export function findPublicationPackageForDraft(
  packages: PublicationPackage[],
  draftId: string
): PublicationPackage | undefined {
  return packages.find((pkg) => pkg.draftId === draftId);
}
