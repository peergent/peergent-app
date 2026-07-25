export type DelegationChannel =
  | "instagram"
  | "linkedin"
  | "newsletter"
  | "blog"
  | "meta_ads"
  | "google_ads"
  | "email"
  | "generic";

export type DelegationObjective =
  | "lead_generation"
  | "brand_awareness"
  | "education"
  | "engagement"
  | "unknown";

export type DelegationRecurrence =
  | "once"
  | "weekly"
  | "monthly"
  | "custom"
  | "trigger";

export type ParsedDelegationIntent = {
  rawMessage: string;
  channel: DelegationChannel;
  topic: string;
  objective: DelegationObjective;
  needsVisual: boolean;
  audience: string | null;
  deadline: string | null;
};

export type DelegationClarifyingQuestion = {
  id: string;
  prompt: string;
  options?: string[];
};

export type DelegationTask = ParsedDelegationIntent & {
  objectiveLabel: string;
  recurrence: DelegationRecurrence;
  taskHint: string;
};

function detectChannel(text: string): DelegationChannel {
  if (/\binstagram\b|\big post\b|\big story\b|\breel\b/.test(text)) return "instagram";
  if (/\blinkedin\b/.test(text)) return "linkedin";
  if (/\bnewsletter\b|\bemail\b/.test(text)) return "newsletter";
  if (/\bblog\b|\barticle\b/.test(text)) return "blog";
  if (/\bmeta ad\b|\bfacebook ad\b/.test(text)) return "meta_ads";
  if (/\bgoogle ad\b/.test(text)) return "google_ads";
  return "generic";
}

function detectObjective(text: string): DelegationObjective {
  if (/\blead\b|\bconversion\b|\bdemo\b|\bsign.?up\b/.test(text)) return "lead_generation";
  if (/\bawareness\b|\bvisibility\b|\bbrand\b/.test(text)) return "brand_awareness";
  if (/\beducat\b|\bexplain\b|\bhow .+ work/.test(text)) return "education";
  if (/\bengagement\b|\bcomment\b|\bcommunity\b/.test(text)) return "engagement";
  return "unknown";
}

function extractTopic(text: string): string {
  const promoting = text.match(/promot(?:e|ing)\s+(.+?)(?:\.|$)/i);
  if (promoting?.[1]) return promoting[1].trim();
  const about = text.match(/about\s+(.+?)(?:\.|$)/i);
  if (about?.[1]) return about[1].trim();
  return text.slice(0, 120).trim();
}

export function parseDelegationIntent(message: string): ParsedDelegationIntent {
  const text = message.trim().toLowerCase();
  return {
    rawMessage: message.trim(),
    channel: detectChannel(text),
    topic: extractTopic(message.trim()),
    objective: detectObjective(text),
    needsVisual: /\bimage\b|\bvisual\b|\bphoto\b|\bgraphic\b|\bcarousel\b/.test(text),
    audience: null,
    deadline: null,
  };
}

export function buildClarifyingQuestions(
  intent: ParsedDelegationIntent
): DelegationClarifyingQuestion[] {
  const questions: DelegationClarifyingQuestion[] = [];

  if (intent.objective === "unknown") {
    questions.push({
      id: "objective",
      prompt:
        "Should this focus on generating leads, brand awareness, or explaining how AI colleagues work?",
      options: ["Lead generation", "Brand awareness", "Explain AI colleagues"],
    });
  }

  if (!intent.audience && intent.channel !== "generic") {
    questions.push({
      id: "audience",
      prompt: "Who is the primary audience?",
    });
  }

  return questions.slice(0, 3);
}

export function objectiveLabel(objective: DelegationObjective, answer?: string): string {
  if (answer?.trim()) return answer.trim();
  switch (objective) {
    case "lead_generation":
      return "lead generation";
    case "brand_awareness":
      return "brand awareness";
    case "education":
      return "explaining how AI colleagues work";
    case "engagement":
      return "engagement";
    default:
      return "your stated goal";
  }
}

export function channelLabel(channel: DelegationChannel): string {
  switch (channel) {
    case "instagram":
      return "Instagram post";
    case "linkedin":
      return "LinkedIn post";
    case "newsletter":
      return "newsletter";
    case "blog":
      return "blog article";
    case "meta_ads":
      return "Meta ad";
    case "google_ads":
      return "Google ad";
    case "email":
      return "email";
    default:
      return "content piece";
  }
}

export function buildDelegationTaskHint(task: DelegationTask): string {
  const parts = [
    task.rawMessage,
    `Channel: ${task.channel}`,
    `Objective: ${task.objectiveLabel}`,
    task.audience ? `Audience: ${task.audience}` : null,
    task.needsVisual ? "Include a branded visual asset." : null,
    task.recurrence !== "once" ? `Recurrence: ${task.recurrence}` : null,
  ].filter(Boolean);
  return parts.join(". ");
}

export function buildDelegationConfirmation(
  intent: ParsedDelegationIntent,
  answers: Record<string, string>
): string {
  const objective = objectiveLabel(intent.objective, answers.objective);
  const deliverable = channelLabel(intent.channel);
  const visual = intent.needsVisual ? " and branded visual" : "";
  return `I'll create ${deliverable}${visual} focused on ${objective}. I'll bring it back here for approval.`;
}

export function finalizeDelegationTask(
  intent: ParsedDelegationIntent,
  answers: Record<string, string>,
  recurrence: DelegationRecurrence
): DelegationTask {
  const resolvedObjective =
    answers.objective === "Lead generation"
      ? "lead_generation"
      : answers.objective === "Brand awareness"
        ? "brand_awareness"
        : answers.objective === "Explain AI colleagues"
          ? "education"
          : intent.objective;

  const task: DelegationTask = {
    ...intent,
    objective: resolvedObjective,
    audience: answers.audience?.trim() || intent.audience,
    deadline: answers.deadline?.trim() || intent.deadline,
    objectiveLabel: objectiveLabel(resolvedObjective, answers.objective),
    recurrence,
    taskHint: "",
  };
  task.taskHint = buildDelegationTaskHint(task);
  return task;
}

export function delegationTaskTitle(task: DelegationTask): string {
  if (task.channel === "instagram") return "Instagram campaign";
  if (task.channel === "linkedin") return "LinkedIn campaign";
  return `${channelLabel(task.channel)} task`;
}
