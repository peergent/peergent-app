"use client";

import { FormEvent, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import WorkspacePanel from "@/components/peer-detail/WorkspacePanel";
import PeerRoleIcon from "@/components/peer/PeerRoleIcon";
import type {
  ConversationMessage,
  ConversationNextStep,
} from "@/lib/marketing-workspace/experience";
import type { RecommendedAction } from "@/lib/marketing-workspace";
import { cn } from "@/lib/ui/cn";

type ConversationPanelProps = {
  messages: ConversationMessage[];
  peerName: string;
  pendingNextStep?: ConversationNextStep | null;
  onSend: (message: string) => void;
  onNextStep?: (step: ConversationNextStep) => void;
  onAction?: (action: RecommendedAction) => void;
  disabled?: boolean;
};

export default function ConversationPanel({
  messages,
  peerName,
  pendingNextStep,
  onSend,
  onNextStep,
  onAction,
  disabled,
}: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pendingNextStep]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleStep = (step: ConversationNextStep) => {
    if (step.action && onAction) {
      onAction(step.action);
    } else if (onNextStep) {
      onNextStep(step);
    }
  };

  return (
    <WorkspacePanel
      title="Conversation"
      description="Ask for direction — I'll tell you what to do next, not claim work is done."
      compact
    >
      <div
        ref={scrollRef}
        className="max-h-[280px] space-y-3 overflow-y-auto rounded-[14px] border border-white/[0.05] bg-black/20 p-3"
      >
        {messages.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-600">
            Try &ldquo;What do you need from me?&rdquo; or &ldquo;What&apos;s the status?&rdquo;
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.role === "peer" && (
                <Avatar
                  icon={<PeerRoleIcon role="Marketing" size={14} />}
                  gradient="from-fuchsia-500 to-violet-600"
                  size="sm"
                  presence="live"
                />
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-[14px] px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-violet-600/80 text-white"
                    : "border border-white/[0.06] bg-white/[0.03] text-slate-300"
                )}
              >
                {msg.role === "peer" && (
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    {peerName}
                  </p>
                )}
                {msg.content}
              </div>
            </div>
          ))
        )}

        {pendingNextStep && (
          <button
            type="button"
            onClick={() => handleStep(pendingNextStep)}
            className="pg-focus-premium ml-10 rounded-[12px] border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300"
          >
            {pendingNextStep.label} →
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask your Marketing Peer…"
          disabled={disabled}
          className="pg-focus-premium min-w-0 flex-1 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="pg-focus-premium flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-violet-600 text-white disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </WorkspacePanel>
  );
}
