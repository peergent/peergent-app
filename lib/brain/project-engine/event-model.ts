/**
 * Project Engine event model — source for Live Activity, Timeline, Progress, notifications.
 */

import type {
  ProjectBrainId,
  ProjectEngineEvent,
  ProjectEngineEventType,
  ProjectLifecycleState,
} from "./types";

export type ProjectEventInput = {
  type: ProjectEngineEventType;
  brainId: ProjectBrainId | null;
  state: ProjectLifecycleState;
  nl: boolean;
  at?: Date;
};

const EVENT_COPY: Record<
  ProjectEngineEventType,
  { en: { title: string; subtitle: string; why: string }; nl: { title: string; subtitle: string; why: string } }
> = {
  project_created: {
    en: { title: "Project created", subtitle: "Emma will begin collecting context.", why: "Every campaign starts with understanding your business." },
    nl: { title: "Project aangemaakt", subtitle: "Emma begint met context verzamelen.", why: "Elke campagne begint met begrip van je bedrijf." },
  },
  context_collection_started: {
    en: { title: "Collecting context", subtitle: "Business, brand, and campaign goals.", why: "Quality context drives every downstream decision." },
    nl: { title: "Context verzamelen", subtitle: "Bedrijf, merk en campagnedoelen.", why: "Goede context drijft elke beslissing." },
  },
  context_ready: {
    en: { title: "Context ready", subtitle: "Research can begin.", why: "Emma has enough to start market analysis." },
    nl: { title: "Context klaar", subtitle: "Research kan starten.", why: "Emma heeft genoeg om marktanalyse te starten." },
  },
  brain_started: {
    en: { title: "Brain started", subtitle: "Processing in progress.", why: "Work is underway on this phase." },
    nl: { title: "Brain gestart", subtitle: "Verwerking bezig.", why: "Er wordt gewerkt aan deze fase." },
  },
  brain_completed: {
    en: { title: "Phase complete", subtitle: "Moving to the next step.", why: "Progress toward publication." },
    nl: { title: "Fase voltooid", subtitle: "Door naar de volgende stap.", why: "Voortgang richting publicatie." },
  },
  brain_failed: {
    en: { title: "Phase needs attention", subtitle: "Emma will retry or ask for input.", why: "Blocked work must be resolved before continuing." },
    nl: { title: "Fase vereist aandacht", subtitle: "Emma probeert opnieuw of vraagt input.", why: "Geblokkeerd werk moet opgelost worden." },
  },
  approval_required: {
    en: { title: "Waiting for your approval", subtitle: "Review before Emma continues.", why: "You stay in control of every major decision." },
    nl: { title: "Wacht op jouw goedkeuring", subtitle: "Review voordat Emma verdergaat.", why: "Jij behoudt controle over elke grote beslissing." },
  },
  approval_granted: {
    en: { title: "Approval granted", subtitle: "Emma continues automatically.", why: "Unblocks the next phase." },
    nl: { title: "Goedkeuring verleend", subtitle: "Emma gaat automatisch verder.", why: "Deblokkeert de volgende fase." },
  },
  waiting: {
    en: { title: "Waiting", subtitle: "Emma is paused until ready.", why: "Timing respects your review cycle." },
    nl: { title: "Wachtend", subtitle: "Emma is gepauzeerd tot klaar.", why: "Timing respecteert je reviewcyclus." },
  },
  state_changed: {
    en: { title: "Project updated", subtitle: "Status changed.", why: "Keeps the campaign timeline accurate." },
    nl: { title: "Project bijgewerkt", subtitle: "Status gewijzigd.", why: "Houdt de campagnetijdlijn accuraat." },
  },
  publish_started: {
    en: { title: "Publishing started", subtitle: "Campaign going live.", why: "Deliverables reach your audience." },
    nl: { title: "Publicatie gestart", subtitle: "Campagne gaat live.", why: "Deliverables bereiken je doelgroep." },
  },
  publish_completed: {
    en: { title: "Campaign published", subtitle: "Monitoring begins.", why: "Performance tracking starts now." },
    nl: { title: "Campagne gepubliceerd", subtitle: "Monitoring begint.", why: "Prestaties worden vanaf nu gevolgd." },
  },
  monitoring_started: {
    en: { title: "Monitoring started", subtitle: "Tracking performance.", why: "Early signals guide optimization." },
    nl: { title: "Monitoring gestart", subtitle: "Prestaties volgen.", why: "Vroege signalen sturen optimalisatie." },
  },
  learning_updated: {
    en: { title: "Learning updated", subtitle: "Memory improved for future campaigns.", why: "Each campaign makes Emma smarter." },
    nl: { title: "Learning bijgewerkt", subtitle: "Geheugen verbeterd voor toekomstige campagnes.", why: "Elke campagne maakt Emma slimmer." },
  },
  project_completed: {
    en: { title: "Project complete", subtitle: "All phases finished.", why: "Campaign lifecycle closed successfully." },
    nl: { title: "Project voltooid", subtitle: "Alle fases afgerond.", why: "Campagnecycle succesvol afgesloten." },
  },
  retry_scheduled: {
    en: { title: "Retry scheduled", subtitle: "Emma will attempt again.", why: "Transient failures should not block progress." },
    nl: { title: "Opnieuw gepland", subtitle: "Emma probeert opnieuw.", why: "Tijdelijke fouten mogen voortgang niet blokkeren." },
  },
  recovery_started: {
    en: { title: "Recovery started", subtitle: "Resuming from last good state.", why: "Protects work already completed." },
    nl: { title: "Herstel gestart", subtitle: "Hervat vanaf laatste goede staat.", why: "Beschermt reeds voltooide work." },
  },
};

const EVENT_TONE: Partial<Record<ProjectEngineEventType, ProjectEngineEvent["tone"]>> = {
  brain_completed: "success",
  approval_granted: "success",
  publish_completed: "success",
  project_completed: "success",
  learning_updated: "insight",
  approval_required: "attention",
  brain_failed: "attention",
  waiting: "neutral",
};

export function createProjectEngineEvent(input: ProjectEventInput): ProjectEngineEvent {
  const copy = EVENT_COPY[input.type][input.nl ? "nl" : "en"];
  const at = (input.at ?? new Date()).toISOString();
  const brainLabel = input.brainId ? ` (${input.brainId})` : "";

  return {
    id: `evt-${input.type}-${at}`,
    at,
    type: input.type,
    brainId: input.brainId,
    state: input.state,
    title: copy.title + brainLabel,
    subtitle: copy.subtitle,
    whyItMatters: copy.why,
    tone: EVENT_TONE[input.type] ?? "neutral",
  };
}

/** Append event to snapshot log (immutable). */
export function appendProjectEvent(
  snapshot: { eventLog: readonly ProjectEngineEvent[] },
  event: ProjectEngineEvent
): readonly ProjectEngineEvent[] {
  return [...snapshot.eventLog, event];
}
