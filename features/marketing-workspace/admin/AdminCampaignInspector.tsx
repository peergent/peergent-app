import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useCallback } from "react";
import { CampaignOrchestrator } from "@/lib/peer-experience/marketing/campaign-orchestrator";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import { buildCampaignCollaborationViewModel } from "@/lib/peer-experience/marketing/campaign-collaboration";
import CampaignCollaborationPanel from "../components/CampaignCollaborationPanel";
import { getMarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { buildCampaignCollaborationBuildInput } from "../lib/build-campaign-collaboration-input";
import { campaignTitleForInspector } from "@/lib/peer-experience/marketing/campaign-review/resolve-campaign-project-context";
import { isCampaignOnboardingComplete } from "@/lib/peer-experience/marketing/campaign-onboarding";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  resolveMarketingWorkUnitKind,
} from "@/lib/peer-experience/marketing/runtime";
import { workUnitsForProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import CampaignDetailSections from "../components/CampaignDetailSections";
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";
import type { CampaignExecutionPlanViewModel } from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";
import type { CampaignContinuationResult } from "@/lib/peer-experience/marketing/campaign-continuation";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import type { CampaignOnboardingInput, CampaignOnboardingResult } from "@/lib/peer-experience/marketing/campaign-onboarding";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import type { MarketingProjectOrigin } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { MarketingProjectTimelineEntry } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingContentItem } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import {
  CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE,
  CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE,
  EMAIL_CAMPAIGN_EXECUTION_COMPLETE_NOTE,
  LINKEDIN_POST_EXECUTION_COMPLETE_NOTE,
} from "@/lib/peer-experience/marketing/runtime";

export type AdminCampaignInspectorProps = {
  peerId: string;
  projectId: string;
  organizationId?: string;
  domainInput: MarketingPeerDomainInput;
  campaign: MarketingCampaignDetailViewModel | null;
  project: MarketingProject;
  projectOrigin?: MarketingProjectOrigin;
  campaignsEnabled: boolean;
  executionPlan?: CampaignExecutionPlanViewModel | null;
  projectActivity?: readonly MarketingProjectTimelineEntry[];
  contentItems?: readonly MarketingContentItem[];
  workspaceReady: boolean;
  onRefresh?: () => void;
  onStartCampaignExecution?: (projectId: string) => Promise<CampaignExecutionWorkspaceResult>;
  onCompleteCampaignOnboarding?: (
    projectId: string,
    input: CampaignOnboardingInput
  ) => Promise<CampaignOnboardingResult>;
  onExecuteMarketingWorkUnit?: (
    workUnitId: string
  ) => Promise<MarketingWorkUnitExecutionResult>;
  onContinueCampaign?: (projectId: string) => Promise<CampaignContinuationResult>;
  campaignContinuationRunning?: boolean;
  executingWorkUnitId?: string | null;
  apiWarnings?: readonly string[];
};

const IDEMPOTENCY_MARKERS = [
  CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE,
  CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE,
  LINKEDIN_POST_EXECUTION_COMPLETE_NOTE,
  EMAIL_CAMPAIGN_EXECUTION_COMPLETE_NOTE,
];

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="mw-admin-json-block" style={{ marginTop: 8 }}>
      <summary>{label}</summary>
      <pre style={{ overflow: "auto", fontSize: 12, marginTop: 8, maxHeight: 320 }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
      <h2 className="mw-section-title" style={{ marginBottom: 10 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AdminCampaignInspector(props: AdminCampaignInspectorProps) {
  const title = campaignTitleForInspector({
    campaignDetail: props.campaign,
    project: props.project,
  });

  const orchestratorPlan = useMemo(
    () =>
      CampaignOrchestrator.plan({
        projectId: props.projectId,
        workUnits: props.domainInput.workUnits,
        strategy: props.domainInput.strategy,
        creativeBriefByCampaignId: props.domainInput.creativeBriefByCampaignId,
      }),
    [props.projectId, props.domainInput]
  );

  const reviewVm = useMemo(() => {
    if (!props.campaign) return null;
    const input = buildCampaignReviewBuildInput({
      peerId: props.peerId,
      projectId: props.projectId,
      domainInput: props.domainInput,
      campaignDetail: props.campaign,
      project: props.project,
      campaignsEnabled: props.campaignsEnabled,
      continuationRunning: props.campaignContinuationRunning,
      activeWorkUnitId: props.executingWorkUnitId,
    });
    return buildCampaignReviewViewModel(input);
  }, [props]);

  const collaborationVm = useMemo(() => {
    if (!reviewVm || !props.campaign) return null;
    const input = buildCampaignReviewBuildInput({
      peerId: props.peerId,
      projectId: props.projectId,
      domainInput: props.domainInput,
      campaignDetail: props.campaign,
      project: props.project,
      campaignsEnabled: props.campaignsEnabled,
      continuationRunning: props.campaignContinuationRunning,
      activeWorkUnitId: props.executingWorkUnitId,
    });
    return buildCampaignCollaborationViewModel(
      buildCampaignCollaborationBuildInput({ reviewBuildInput: input, reviewVm })
    );
  }, [reviewVm, props]);

  const adminCampaignCopy = useMemo(() => getMarketingCampaignCopy("en"), []);

  const projectUnits = useMemo(
    () => workUnitsForProject(props.projectId, [...props.domainInput.workUnits]),
    [props.projectId, props.domainInput.workUnits]
  );

  const copyProjectId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(props.projectId);
    } catch {
      /* ignore */
    }
  }, [props.projectId]);

  const onboardingComplete = isCampaignOnboardingComplete(props.project.campaignSetup);

  return (
    <div data-testid="mw-admin-campaign-inspector">
      <div className="mw-section-head" style={{ marginBottom: 12 }}>
        <Link
          href={getProjectHref(props.peerId, props.projectId)}
          className="mw-detail-back pg-focus-premium"
        >
          ← Back to customer campaign
        </Link>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
          {props.onRefresh ? (
            <button type="button" className="mw-btn-secondary pg-focus-premium" onClick={props.onRefresh}>
              Refresh workspace
            </button>
          ) : null}
          <button type="button" className="mw-btn-secondary pg-focus-premium" onClick={() => void copyProjectId()}>
            Copy project id
          </button>
        </div>
      </div>

      <InspectorSection title="Overview">
        <dl className="mw-detail-dl">
          <div>
            <dt>Project id</dt>
            <dd>{props.projectId}</dd>
          </div>
          <div>
            <dt>Title</dt>
            <dd>{title}</dd>
          </div>
          <div>
            <dt>Peer id</dt>
            <dd>{props.peerId}</dd>
          </div>
          {props.organizationId ? (
            <div>
              <dt>Organization id</dt>
              <dd>{props.organizationId}</dd>
            </div>
          ) : null}
          <div>
            <dt>Origin</dt>
            <dd>{props.projectOrigin ?? "—"}</dd>
          </div>
          <div>
            <dt>Campaign status</dt>
            <dd>{props.campaign?.status ?? props.campaign?.statusLabel ?? "—"}</dd>
          </div>
          <div>
            <dt>Approval mode</dt>
            <dd>{props.project.campaignSetup?.approvalMode ?? "—"}</dd>
          </div>
          <div>
            <dt>Onboarding complete</dt>
            <dd>{onboardingComplete ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{props.project.createdAt}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{props.project.updatedAt}</dd>
          </div>
          <div>
            <dt>Workspace ready</dt>
            <dd>{props.workspaceReady ? "yes" : "no"}</dd>
          </div>
        </dl>
      </InspectorSection>

      <InspectorSection title="Orchestration">
        <p className="mw-kn-helper">
          Continuation running: {props.campaignContinuationRunning ? "yes" : "no"} · Active
          work unit: {props.executingWorkUnitId ?? "—"}
        </p>
        <h3 className="mw-modal-label">Executable</h3>
        <ul className="mw-campaign-meta">
          {orchestratorPlan.executableWorkUnits.map((entry) => (
            <li key={entry.workUnit.id}>
              {entry.workUnit.title} · {entry.runtimeKind} · {entry.workUnit.status}
            </li>
          ))}
        </ul>
        <h3 className="mw-modal-label" style={{ marginTop: 12 }}>
          Blocked
        </h3>
        <ul className="mw-campaign-meta">
          {orchestratorPlan.blockedWorkUnits.map((block) => (
            <li key={block.workUnitId}>
              {block.workUnit.title} · {block.runtimeKind} · {block.blockingReason}
              {block.missingDependencies.length > 0
                ? ` · missing: ${block.missingDependencies.join(", ")}`
                : ""}
            </li>
          ))}
        </ul>
        <h3 className="mw-modal-label" style={{ marginTop: 12 }}>
          Completed
        </h3>
        <ul className="mw-campaign-meta">
          {orchestratorPlan.completedWorkUnits.map((entry) => (
            <li key={entry.workUnit.id}>
              {entry.workUnit.title} · {entry.runtimeKind} · {entry.workUnit.status}
            </li>
          ))}
        </ul>
      </InspectorSection>

      <InspectorSection title="Work units">
        <ul className="mw-campaign-meta">
          {projectUnits.map((unit) => {
            const kind = resolveMarketingWorkUnitKind(unit);
            const latestNote = unit.eventLog.at(-1)?.note ?? "—";
            const idempotent = unit.eventLog.some((e) =>
              IDEMPOTENCY_MARKERS.some((m) => e.note.includes(m))
            );
            return (
              <li key={unit.id} style={{ marginBottom: 10 }}>
                <strong>{unit.title}</strong>
                <br />
                id: {unit.id} · kind: {kind ?? "unknown"} · lifecycle: {unit.status} · channel:{" "}
                {unit.channel} · deliverable: {unit.deliverableKind}
                <br />
                plan ref: {unit.planActivityReference ?? "—"} · paused:{" "}
                {unit.paused ? "yes" : "no"} · cancelled: {unit.cancelled ? "yes" : "no"}
                <br />
                latest note: {latestNote}
                {idempotent ? " · idempotency marker present" : ""}
              </li>
            );
          })}
        </ul>
      </InspectorSection>

      <InspectorSection title="Artifacts">
        <ul className="mw-campaign-meta">
          <li>Strategy: {props.domainInput.strategy?.summary ? "present" : "absent"}</li>
          <li>
            Creative brief:{" "}
            {props.domainInput.creativeBriefByCampaignId?.[props.projectId] ? "present" : "absent"}
          </li>
          <li>
            LinkedIn artifacts:{" "}
            {Object.keys(props.domainInput.linkedinPostByWorkUnitId ?? {}).length}
          </li>
          <li>
            Email artifacts: {Object.keys(props.domainInput.emailByWorkUnitId ?? {}).length}
          </li>
        </ul>
        <JsonBlock label="Strategy (safe)" value={props.domainInput.strategy} />
        <JsonBlock
          label="Creative brief (safe)"
          value={props.domainInput.creativeBriefByCampaignId?.[props.projectId] ?? null}
        />
        <JsonBlock label="LinkedIn by work unit id" value={props.domainInput.linkedinPostByWorkUnitId} />
        <JsonBlock label="Email by work unit id" value={props.domainInput.emailByWorkUnitId} />
      </InspectorSection>

      <InspectorSection title="Approval / review">
        <p className="mw-kn-helper">Approval mode: {props.project.campaignSetup?.approvalMode ?? "—"}</p>
        {reviewVm ? (
          <>
            <h3 className="mw-modal-label">Review queue</h3>
            <ul className="mw-campaign-meta">
              {reviewVm.reviewQueue.map((item) => (
                <li key={item.id}>
                  {item.artifactTypeLabel} · {item.title} · {item.statusLabel} · review required:{" "}
                  {item.reviewRequired ? "yes" : "no"}
                </li>
              ))}
            </ul>
            <h3 className="mw-modal-label" style={{ marginTop: 8 }}>
              Review decisions
            </h3>
            <JsonBlock
              label="Current decisions by work unit"
              value={props.domainInput.campaignReviewDecisionByWorkUnitId ?? {}}
            />
            <JsonBlock
              label="Decision history by work unit"
              value={props.domainInput.campaignReviewDecisionHistoryByWorkUnitId ?? {}}
            />
            <JsonBlock
              label="Artifact versions by work unit"
              value={props.domainInput.campaignArtifactVersionByWorkUnitId ?? {}}
            />
            <ul className="mw-campaign-meta">
              {reviewVm.allReviewItems.map((item) => (
                <li key={`decision-${item.id}`}>
                  {item.workUnitId} · v{item.artifactVersion} · {item.decisionStatus} · blocked:{" "}
                  {item.continuationBlocked ? "yes" : "no"} · revision:{" "}
                  {item.canRequestRevision ? "ready" : "no"}
                </li>
              ))}
            </ul>
            <h3 className="mw-modal-label" style={{ marginTop: 8 }}>
              Review-ready without preview artifact
            </h3>
            <ul className="mw-campaign-meta">
              {reviewVm.allReviewItems
                .filter((i) => i.status === "awaiting_review" && !i.preview)
                .map((item) => (
                  <li key={item.id}>
                    {item.artifactTypeLabel} · {item.title}
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="mw-kn-helper">Campaign detail VM unavailable — review summary omitted.</p>
        )}
      </InspectorSection>

      {collaborationVm ? (
        <InspectorSection title="Collaboration & publish readiness">
          <p className="mw-modal-label">Readiness diagnostics</p>
          <p className="mw-kn-helper">
            {collaborationVm.publishReadiness.customerLabel} ({collaborationVm.publishReadiness.status})
          </p>
          <ul className="mw-campaign-meta">
            {collaborationVm.publishReadiness.diagnostics.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <h3 className="mw-modal-label" style={{ marginTop: 12 }}>
            Publish targets (architecture)
          </h3>
          <ul className="mw-campaign-meta">
            {collaborationVm.publishTargets.targets.map((t) => (
              <li key={t.id}>
                {t.label} · linked: {t.linkedArtifactTypes.join(", ") || "—"}
              </li>
            ))}
          </ul>
          {collaborationVm.artifacts.map((artifact) => (
            <details key={artifact.workUnitId} style={{ marginTop: 12 }}>
              <summary>
                {artifact.artifactTypeLabel} · v{artifact.currentVersion} · {artifact.workUnitId}
              </summary>
              <CampaignCollaborationPanel
                artifact={artifact}
                mode="admin"
                copy={adminCampaignCopy}
                variant="admin-inline"
              />
              <JsonBlock label="Version history VM" value={artifact.versionHistory} />
              <JsonBlock label="Timeline VM" value={artifact.timeline} />
              {artifact.comparisonToPrevious ? (
                <JsonBlock label="Comparison VM" value={artifact.comparisonToPrevious} />
              ) : null}
              <JsonBlock label="Feedback history VM" value={artifact.feedbackHistory} />
            </details>
          ))}
        </InspectorSection>
      ) : null}

      <InspectorSection title="Runtime / diagnostics">
        <ul className="mw-campaign-meta">
          <li>Active work unit: {props.executingWorkUnitId ?? "—"}</li>
          <li>Continuation: {props.campaignContinuationRunning ? "running" : "idle"}</li>
        </ul>
        {props.apiWarnings && props.apiWarnings.length > 0 ? (
          <JsonBlock label="API warnings" value={props.apiWarnings} />
        ) : null}
        <JsonBlock
          label="Safe event notes (project work units)"
          value={projectUnits.map((u) => ({
            id: u.id,
            title: u.title,
            notes: u.eventLog.map((e) => e.note),
          }))}
        />
      </InspectorSection>

      {props.campaign ? (
        <InspectorSection title="Legacy technical campaign view">
          <CampaignDetailSections
            campaign={props.campaign}
            projectActivity={props.projectActivity}
            executionPlan={props.executionPlan}
            campaignsEnabled={props.campaignsEnabled}
            projectId={props.projectId}
            projectOrigin={props.projectOrigin}
            workUnits={props.domainInput.workUnits}
            project={props.project}
            peerId={props.peerId}
            peerName={props.domainInput.peerName}
            onStartCampaignExecution={props.onStartCampaignExecution}
            onCompleteCampaignOnboarding={props.onCompleteCampaignOnboarding}
            onExecuteMarketingWorkUnit={props.onExecuteMarketingWorkUnit}
            onContinueCampaign={props.onContinueCampaign}
            campaignContinuationRunning={props.campaignContinuationRunning}
            executingWorkUnitId={props.executingWorkUnitId}
            campaignStrategy={props.domainInput.strategy}
            creativeBriefByCampaignId={props.domainInput.creativeBriefByCampaignId}
            linkedinPostByWorkUnitId={props.domainInput.linkedinPostByWorkUnitId}
            emailByWorkUnitId={props.domainInput.emailByWorkUnitId}
          />
        </InspectorSection>
      ) : (
        <InspectorSection title="Legacy technical campaign view">
          <p className="mw-kn-helper">
            Campaign detail projection unavailable. Enable the campaign workspace flag or open a
            campaign wizard project to render legacy sections.
          </p>
        </InspectorSection>
      )}
    </div>
  );
}
