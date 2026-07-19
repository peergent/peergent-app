"use client";

import { MessageCircle } from "lucide-react";
import type { CollaborationMessage } from "@/lib/marketing-workspace/experience";
import { cn } from "@/lib/ui/cn";

const TONE_STYLES: Record<CollaborationMessage["tone"], string> = {
  info: "border-white/[0.08] bg-white/[0.03] text-slate-300",
  ready: "border-violet-500/20 bg-violet-500/[0.06] text-violet-100",
  gap: "border-amber-500/20 bg-amber-500/[0.06] text-amber-100",
  blocked: "border-red-500/20 bg-red-500/[0.06] text-red-100",
  approval: "border-fuchsia-500/20 bg-fuchsia-500/[0.06] text-fuchsia-100",
};

type CollaborationBannerProps = {
  message: CollaborationMessage | null;
  peerName: string;
};

export default function CollaborationBanner({
  message,
  peerName,
}: CollaborationBannerProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[16px] border px-4 py-3.5",
        TONE_STYLES[message.tone]
      )}
    >
      <MessageCircle size={18} className="mt-0.5 shrink-0 opacity-70" aria-hidden />
      <p className="text-sm leading-relaxed">
        <span className="font-medium">{peerName}:</span> {message.message}
      </p>
    </div>
  );
}
