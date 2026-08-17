"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import { PgOfficeShell, PgSkeletonRows } from "@/components/design-system";
import CampaignEvidenceModal from "@/features/office/campaign/CampaignEvidenceModal";
import CampaignCompanyContextModal from "@/features/office/campaign/CampaignCompanyContextModal";
import CampaignCompetitorModal from "@/features/office/campaign/CampaignCompetitorModal";
import CampaignScheduleModal from "@/features/office/campaign/CampaignScheduleModal";
import CampaignOptimizationPanel from "@/features/office/campaign/CampaignOptimizationPanel";
import CampaignWebsiteModal from "@/features/office/campaign/CampaignWebsiteModal";
import CampaignApprovalReviewModal from "@/features/office/campaign/CampaignApprovalReviewModal";
import CampaignExperienceView from "@/features/office/campaign/CampaignExperienceView";
import { useCampaignRuntimeProjection } from "@/features/office/campaign/useCampaignRuntimeProjection";
import { useCampaignWorkspaceActions } from "@/features/office/campaign/useCampaignWorkspaceActions";
import OfficeDeliverableReviewModal from "@/features/office/deliverable/OfficeDeliverableReviewModal";
import { useOfficePeer } from "@/features/office/useOfficePeer";
import { buildCampaignDetailViewModel, findCampaignProject } from "@/lib/office/campaign/build-campaign-detail";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { formatOfficeDate } from "@/lib/office/campaign/campaign-optimization";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import Link from "next/link";
import { officeHref } from "@/lib/office/links";

function CampaignDetailInner() {
  const params = useParams<{ peerId: string; campaignId: string }>();
  const campaignId = params.campaignId;

  const {
    peerId,
    peerName,
    peerRole,
    domainInput,
    localePreference,
    loading,
    isDemo,
    team,
    roster,
    openNewCampaign,
    newCampaignModal,
    workspace,
  } = useOfficePeer();

  const liveProject = findCampaignProject(domainInput, campaignId);

  const { projection: runtimeProjection, loading: runtimeLoading } = useCampaignRuntimeProjection({
    peerId,
    projectId: campaignId,
    isDemo,
  });

  const campaignWorkflow = useMemo(() => {
    if (!liveProject) return null;
    return buildCampaignWorkflowViewModel({
      peerId,
      project: liveProject,
      domainInput,
      locale: localePreference,
      isDemo,
      runtimeProjection,
    });
  }, [domainInput, isDemo, liveProject, localePreference, peerId, runtimeProjection]);

  const model = useMemo(
    () =>
      buildCampaignDetailViewModel({
        peerId,
        projectId: campaignId,
        domainInput,
        locale: localePreference,
        isDemo,
        runtimeProjection,
      }),
    [peerId, campaignId, domainInput, isDemo, localePreference, runtimeProjection]
  );

  const campaignActions = useCampaignWorkspaceActions({
    peerId,
    projectId: campaignId,
    domainInput,
    localePreference,
    isDemo,
    workspace,
    runtimeProjection,
  });

  const deskModel = useMemo(
    () =>
      buildMarketingDeskViewModel({
        domainInput,
        peerName,
        peerRole,
        localePreference,
      }),
    [domainInput, peerName, peerRole, localePreference]
  );

  const nl = localePreference === "nl";

  return (
    <>
      <PgOfficeShell
        peerId={peerId}
        locale={localePreference}
        isDemo={isDemo}
        peerName={peerName}
        peerRole={peerRole}
        team={team}
        roster={roster}
        active="work"
        presence={loading ? null : deskModel.presence}
        decisionCount={deskModel.decisions.length}
        onBrief={() => undefined}
        onSearch={() => undefined}
        onNewCampaign={openNewCampaign}
      >
        {loading || runtimeLoading ? (
          <PgSkeletonRows rows={4} rowHeight={104} />
        ) : model ? (
          <CampaignExperienceView
            model={model}
            locale={localePreference}
            domainInput={domainInput}
            isDemo={isDemo}
            workflow={campaignWorkflow}
            progressMessage={campaignActions.progressMessage}
            onPrimaryCta={campaignActions.handleNextStepCta}
            updatedAtLabel={
              formatOfficeDate(liveProject?.updatedAt ?? null, localePreference) ?? undefined
            }
            onOpenOptimization={() => campaignActions.setOptimizationOpen(true)}
          />
        ) : (
          <div className="pg-v13-panel p-6" data-testid="office-campaign-not-found">
            <p className="text-[15px] text-[var(--pg-v13-ink-soft)]">
              {nl ? "Deze campagne is niet gevonden in deze workspace." : "This campaign was not found in this workspace."}
            </p>
            <Link href={officeHref(peerId, "work")} className="pg-v13-btn pg-v13-btn--ghost mt-4 inline-flex no-underline">
              {nl ? "Terug naar Werk" : "Back to Work"}
            </Link>
          </div>
        )}
      </PgOfficeShell>

      <CampaignApprovalReviewModal
        open={campaignActions.approvalReviewOpen}
        onClose={campaignActions.closeCampaignApprovalReview}
        locale={localePreference}
        package={campaignActions.approvalPackage}
        loading={campaignActions.approvalPackageLoading}
        error={campaignActions.approvalPackageError}
        phase={campaignActions.approvalPhase}
        onApprove={campaignActions.handleApprovalPackageApprove}
        onRequestChanges={campaignActions.handleApprovalRequestChanges}
      />

      <CampaignEvidenceModal
        open={Boolean(campaignActions.evidenceStep)}
        onClose={campaignActions.closeEvidence}
        step={campaignActions.evidenceStep}
        locale={localePreference}
        executionMode={model?.executionMode}
        phase={campaignActions.evidencePhase}
        progressLabel={campaignActions.evidenceProgressLabel}
        devDiagnostics={campaignActions.evidenceDevDiagnostics}
        errorMessage={campaignActions.evidenceError}
        onPrimaryAction={campaignActions.handleEvidencePrimary}
        onMissingAction={campaignActions.handleEvidenceMissingAction}
        onRequestChanges={campaignActions.handleEvidenceRequestChanges}
        onReject={campaignActions.handleEvidenceReject}
      />

      <CampaignWebsiteModal
        open={campaignActions.websiteModalOpen}
        onClose={() => campaignActions.setWebsiteModalOpen(false)}
        locale={localePreference}
        isDemo={isDemo}
        initialUrl={campaignActions.storedWebsiteUrl}
        onSubmit={campaignActions.handleAddWebsiteUrl}
      />

      <CampaignCompetitorModal
        open={campaignActions.competitorModalOpen}
        onClose={() => campaignActions.setCompetitorModalOpen(false)}
        locale={localePreference}
        onSubmit={campaignActions.handleAddCompetitors}
      />

      <CampaignCompanyContextModal
        open={campaignActions.companyContextModalOpen}
        onClose={() => campaignActions.setCompanyContextModalOpen(false)}
        locale={localePreference}
        initialValues={campaignActions.companyContextInitialValues}
        onSubmit={campaignActions.handleSaveCompanyContext}
      />

      {model ? (
        <>
          <CampaignScheduleModal
            open={campaignActions.scheduleModalOpen}
            onClose={() => campaignActions.setScheduleModalOpen(false)}
            locale={localePreference}
            liveMode={!isDemo}
            initialScheduledAt={model.scheduleInfo?.scheduledAt ?? null}
            onConfirm={(iso) => campaignActions.handleScheduleCampaign(iso)}
          />
          <CampaignOptimizationPanel
            open={campaignActions.optimizationOpen}
            onClose={() => campaignActions.closeOptimization()}
            locale={localePreference}
            executionMode={model.executionMode}
            results={model.resultsViewModel}
            channels={model.channels}
          />
        </>
      ) : null}

      {campaignActions.reviewModel ? (
        <OfficeDeliverableReviewModal
          open
          onClose={campaignActions.closeReview}
          locale={localePreference}
          model={campaignActions.reviewModel}
          reviewProgress={campaignActions.reviewProgress}
          onApprove={campaignActions.handleDeliverableApprove}
          onRequestChanges={campaignActions.handleDeliverableChanges}
          onReject={campaignActions.handleDeliverableReject}
          detailHref={`/office/${peerId}/content/${campaignActions.reviewModel.draftId}`}
        />
      ) : null}

      {newCampaignModal}
    </>
  );
}

export default function OfficeCampaignDetailPage() {
  return (
    <Suspense fallback={null}>
      <CampaignDetailInner />
    </Suspense>
  );
}
