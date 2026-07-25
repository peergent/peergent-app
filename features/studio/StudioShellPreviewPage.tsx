"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PgAppShell } from "@/components/design-system";
import PeerStudioShellContent from "@/features/studio/PeerStudioShellContent";
import {
  isStudioShellPreviewScene,
  studioShellPreviewFixture,
  STUDIO_SHELL_PREVIEW_SCENES,
} from "@/lib/studio/studio-shell-preview";
import { progressRailChapterToTimelineNodeId } from "@/lib/peer-experience/marketing/build-progress-rail-view-model";
import type { ProgressRailChapterId } from "@/lib/peer-experience/marketing/build-progress-rail-view-model";
import { createConversationMessage } from "@/lib/marketing-workspace/experience/conversation";

export default function StudioShellPreviewPage() {
  const searchParams = useSearchParams();
  const sceneParam = searchParams.get("scene");
  const scene = isStudioShellPreviewScene(sceneParam) ? sceneParam : "idle";
  const fixture = useMemo(() => studioShellPreviewFixture(scene), [scene]);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationMessages, setConversationMessages] = useState(fixture.conversationSeed);

  const handleProgressChapterSelect = useCallback(
    (chapterId: ProgressRailChapterId) => {
      void progressRailChapterToTimelineNodeId(chapterId, fixture.viewModel.timeline);
    },
    [fixture.viewModel.timeline]
  );

  const handleConversationSend = useCallback(
    (message: string) => {
      setConversationMessages((prev) => [
        ...prev,
        createConversationMessage("user", message),
        createConversationMessage(
          "peer",
          "I'll put that on the table — use the invitation above when you're ready."
        ),
      ]);
    },
    []
  );

  return (
    <main className="min-h-screen bg-[var(--pg-color-canvas)] text-[var(--pg-color-text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[8%] top-[6%] h-[400px] w-[400px] rounded-full bg-[var(--pg-color-accent-subtle)] blur-[120px]" />
      </div>

      <PgAppShell contentClassName="relative flex min-h-screen flex-col">
        <div className="border-b border-[var(--pg-color-border-subtle)] bg-[var(--pg-color-surface)]/40 px-4 py-2 text-xs text-[var(--pg-color-text-tertiary)] md:px-8">
          Local preview · same shell components as{" "}
          <code className="text-[var(--pg-color-text-secondary)]">/team/[peerId]</code> · scene:{" "}
          <strong className="text-[var(--pg-color-text-secondary)]">{scene}</strong>
        </div>

        <PeerStudioShellContent
          data-scene={scene}
          peer={fixture.peer}
          campaignTitle={fixture.campaignTitle}
          presenceLine={fixture.statusLine}
          presence={fixture.viewModel.now.presence}
          progressRail={fixture.progressRail}
          deliverable={fixture.viewModel.deliverable}
          primaryAction={fixture.viewModel.now.primaryAction}
          generating={fixture.generating}
          onProgressChapterSelect={handleProgressChapterSelect}
          onPrimaryAction={() => undefined}
          onReview={() => undefined}
          conversationOpen={conversationOpen}
          onConversationOpenChange={setConversationOpen}
          conversationMessages={conversationMessages}
          onConversationSend={handleConversationSend}
        />

        <nav
          aria-label="Preview scenes"
          className="flex flex-wrap gap-2 border-t border-[var(--pg-color-border-subtle)] px-4 py-3 md:px-8"
        >
          {STUDIO_SHELL_PREVIEW_SCENES.map((item) => (
            <Link
              key={item}
              href={`/studio-shell-preview?scene=${item}`}
              className={
                item === scene
                  ? "rounded-[var(--pg-radius-sm)] bg-[var(--pg-color-accent-muted)] px-3 py-1.5 text-xs font-medium text-[var(--pg-color-text-primary)]"
                  : "rounded-[var(--pg-radius-sm)] px-3 py-1.5 text-xs text-[var(--pg-color-text-secondary)] hover:bg-white/[0.04]"
              }
            >
              {item}
            </Link>
          ))}
        </nav>
      </PgAppShell>
    </main>
  );
}
