"use client";

import { memo } from "react";
import {
  PgPeerPresence,
  PgProgressRail,
  PgStudioThreshold,
} from "@/components/design-system";
import type { ProgressRailChapterId, ProgressRailViewModel } from "@/lib/peer-experience/marketing/build-progress-rail-view-model";
import type { NowPresence } from "@/lib/peer-experience";

export type StudioChromeProps = {
  peerName: string;
  peerRole: string;
  campaignTitle: string;
  presenceLine: string;
  presence: NowPresence;
  progressRail: ProgressRailViewModel;
  onProgressChapterSelect?: (chapterId: ProgressRailChapterId) => void;
  onDirectMaya?: () => void;
  directMayaDisabled?: boolean;
};

/** Stable studio chrome — does not remount when work plane state changes. */
const StudioChrome = memo(function StudioChrome({
  peerName,
  peerRole,
  campaignTitle,
  presenceLine,
  presence,
  progressRail,
  onProgressChapterSelect,
  onDirectMaya,
  directMayaDisabled,
}: StudioChromeProps) {
  return (
    <>
      <PgStudioThreshold
        campaignTitle={campaignTitle}
        onDirectMaya={onDirectMaya}
        directMayaDisabled={directMayaDisabled}
      />
      <PgPeerPresence
        peerName={peerName}
        peerRole={peerRole}
        statusLine={presenceLine}
        presence={presence}
      />
      <PgProgressRail
        chapters={progressRail.chapters}
        currentChapterId={progressRail.currentChapterId}
        onSelectChapter={onProgressChapterSelect}
      />
    </>
  );
});

export default StudioChrome;
