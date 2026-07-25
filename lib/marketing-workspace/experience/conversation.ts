import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { RecommendedAction } from "../types";
import type { ArtifactSection } from "./navigation";
import type { ConversationMessage } from "./types";

export type ConversationContext = {
  peerName: string;
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
};

export type ConversationNextStep = {
  label: string;
  section: ArtifactSection;
  action?: RecommendedAction;
};

export type ConversationResult = {
  peerReply: ConversationMessage;
  nextStep?: ConversationNextStep;
};

export function createConversationMessage(
  role: ConversationMessage["role"],
  content: string
): ConversationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

export function respondToConversation(
  userMessage: string,
  context: ConversationContext
): ConversationResult {
  const text = userMessage.trim().toLowerCase();

  if (matchesAny(text, ["installer", "installers", "segment", "audience", "focus on"])) {
    return {
      peerReply: createConversationMessage(
        "peer",
        "I haven't changed the strategy yet — I can't update artifacts from conversation alone. Add or refine audience details in Knowledge, then use Regenerate strategy in the Strategy section to apply that focus."
      ),
      nextStep: { label: "Open strategy", section: "strategy" },
    };
  }

  if (matchesAny(text, ["approve", "approval", "review draft"])) {
    const pending = context.drafts.filter(
      (d) => d.status === "draft" || d.status === "ready_for_review"
    );
    if (pending.length === 0) {
      return {
        peerReply: createConversationMessage(
          "peer",
          "No drafts are waiting for approval right now. When I create one, it will appear in Drafts for you to review."
        ),
        nextStep: { label: "View campaign plan", section: "plan" },
      };
    }
    return {
      peerReply: createConversationMessage(
        "peer",
        `I haven't received your approval yet. Please open "${pending[0].title}" in Drafts and click Approve — I'll continue once that status changes.`
      ),
      nextStep: { label: `Review "${pending[0].title}"`, section: "drafts" },
    };
  }

  if (matchesAny(text, ["generate strategy", "create strategy", "build strategy"])) {
    if (context.strategy) {
      return {
        peerReply: createConversationMessage(
          "peer",
          "A strategy already exists. Use Regenerate strategy in the Strategy section if you want a new version — that will replace the current one."
        ),
        nextStep: { label: "Open strategy", section: "strategy" },
      };
    }
    return {
      peerReply: createConversationMessage(
        "peer",
        "I can't start strategy generation from chat yet. Use the primary action above or open the Strategy section and click Generate strategy."
      ),
      nextStep: {
        label: "Generate strategy",
        section: "strategy",
        action: {
          id: "generate-strategy",
          title: "Generate strategy",
          description: "",
          priority: "high",
          kind: "generate-strategy",
        },
      },
    };
  }

  if (matchesAny(text, ["strategy", "positioning", "position"])) {
    if (context.strategy) {
      return {
        peerReply: createConversationMessage(
          "peer",
          `The current strategy summary: ${context.strategy.summary.slice(0, 160)}${context.strategy.summary.length > 160 ? "…" : ""} Open the Strategy section to read the full deliverable.`
        ),
        nextStep: { label: "Read strategy", section: "strategy" },
      };
    }
    return {
      peerReply: createConversationMessage(
        "peer",
        "No strategy exists yet. Generate one first — I'll produce it when you trigger that action in the Strategy section."
      ),
      nextStep: { label: "Open strategy", section: "strategy" },
    };
  }

  if (matchesAny(text, ["generate plan", "create plan", "build plan"])) {
    if (!context.strategy) {
      return {
        peerReply: createConversationMessage(
          "peer",
          "I can't create a plan without a strategy. Generate the strategy first, then use Create plan in the Plan section."
        ),
        nextStep: { label: "Open strategy", section: "strategy" },
      };
    }
    if (context.plan) {
      return {
        peerReply: createConversationMessage(
          "peer",
          "A plan already exists. Open the Plan section to review the full execution plan and content calendar."
        ),
        nextStep: { label: "Open plan", section: "plan" },
      };
    }
    return {
      peerReply: createConversationMessage(
        "peer",
        "I can't start plan generation from chat yet. Use the primary action above or open the Plan section and click Create plan."
      ),
      nextStep: {
        label: "Create plan",
        section: "plan",
        action: {
          id: "generate-plan",
          title: "Create plan",
          description: "",
          priority: "high",
          kind: "generate-plan",
        },
      },
    };
  }

  if (matchesAny(text, ["plan", "calendar", "timeline", "schedule"])) {
    if (!context.strategy) {
      return {
        peerReply: createConversationMessage(
          "peer",
          "I need a strategy before a plan. Generate the strategy first — I haven't created either yet."
        ),
        nextStep: { label: "Open strategy", section: "strategy" },
      };
    }
    if (context.plan) {
      return {
        peerReply: createConversationMessage(
          "peer",
          `The plan includes ${context.plan.contentCalendar.length} calendar slots. Open the Plan or Calendar section to review activities and create drafts.`
        ),
        nextStep: { label: "Open campaign plan", section: "plan" },
      };
    }
    return {
      peerReply: createConversationMessage(
        "peer",
        "No plan exists yet. Trigger Create plan in the Plan section — I won't build it until you do."
      ),
      nextStep: { label: "Open plan", section: "plan" },
    };
  }

  if (matchesAny(text, ["draft", "content", "linkedin", "post", "write"])) {
    if (!context.plan) {
      return {
        peerReply: createConversationMessage(
          "peer",
          "I can't draft content without a plan. Create the execution plan first — nothing has been drafted yet."
        ),
        nextStep: { label: "Open plan", section: "plan" },
      };
    }
    const next = context.plan.contentCalendar.find(
      (entry) =>
        !context.drafts.some(
          (d) =>
            d.planActivityReference.trim().toLowerCase() ===
            entry.title.trim().toLowerCase()
        )
    );
    if (next) {
      return {
        peerReply: createConversationMessage(
          "peer",
          `I haven't drafted "${next.title}" yet. Open the Calendar section and click Create draft on that activity — I'll generate it when you trigger that action.`
        ),
        nextStep: {
          label: `Draft "${next.title}"`,
          section: "plan",
          action: {
            id: `draft-${next.title}`,
            title: `Draft: ${next.title}`,
            description: "",
            priority: "medium",
            kind: "create-draft",
            planActivityReference: next.title,
          },
        },
      };
    }
    return {
      peerReply: createConversationMessage(
        "peer",
        "All calendar slots have drafts. Open Drafts to review pending ones — I haven't changed any until you approve or reject."
      ),
      nextStep: { label: "Open drafts", section: "drafts" },
    };
  }

  if (matchesAny(text, ["gap", "missing", "need more", "what do you need"])) {
    const gaps = context.understanding?.gaps ?? [];
    if (gaps.length === 0) {
      return {
        peerReply: createConversationMessage(
          "peer",
          "I'm not flagging any knowledge gaps right now. If something is missing, add it in Knowledge and reload this workspace."
        ),
        nextStep: { label: "Review understanding", section: "understanding" },
      };
    }
    return {
      peerReply: createConversationMessage(
        "peer",
        `I need more information before I can work confidently: ${gaps.slice(0, 3).join(", ")}. I haven't updated anything — please add this in Knowledge first.`
      ),
      nextStep: { label: "Review understanding", section: "understanding" },
    };
  }

  if (matchesAny(text, ["status", "what are you doing", "working on", "progress"])) {
    const parts: string[] = [];
    if (context.strategy) parts.push("strategy on file");
    else parts.push("no strategy yet");
    if (context.plan) parts.push("plan on file");
    else parts.push("no plan yet");
    if (context.drafts.length) parts.push(`${context.drafts.length} draft(s)`);
    return {
      peerReply: createConversationMessage(
        "peer",
        `Current state: ${parts.join(", ")}. Check Current focus at the top of the workspace for what I'm waiting on.`
      ),
    };
  }

  return {
    peerReply: createConversationMessage(
      "peer",
      "I can help you navigate this workspace, but I won't claim to have done work unless an artifact actually changed. Ask about strategy, the plan, drafts, or what I need from you — or use the suggested next step buttons."
    ),
  };
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}
