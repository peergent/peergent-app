"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PgAlcove } from "@/components/design-system";
import type { TaskDrawerTab, TaskDrawerViewModel } from "@/lib/peer-experience/marketing/build-task-drawer-model";
import DeliverablePreview from "../previews/DeliverablePreview";
import type { EmmaPreviewViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";

const TABS: { id: TaskDrawerTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "files", label: "Files" },
  { id: "reasoning", label: "Reasoning" },
  { id: "comments", label: "Comments" },
  { id: "publishing", label: "Publishing" },
  { id: "performance", label: "Performance" },
  { id: "history", label: "History" },
];

export type EmmaTaskDrawerProps = {
  open: boolean;
  tab: TaskDrawerTab;
  model: TaskDrawerViewModel | null;
  preview: EmmaPreviewViewModel | null;
  onClose: () => void;
  onTabChange: (tab: TaskDrawerTab) => void;
  onOpenFile?: (refId: string) => void;
  onPreparePublish?: (draftId: string) => void;
  onMarkPublished?: (draftId: string) => void;
  onMessageEmma?: (projectTitle: string) => void;
};

export default function EmmaTaskDrawer({
  open,
  tab,
  model,
  preview,
  onClose,
  onTabChange,
  onOpenFile,
  onPreparePublish,
  onMarkPublished,
  onMessageEmma,
}: EmmaTaskDrawerProps) {
  if (!model) return null;

  return (
    <PgAlcove open={open} title={model.title} onClose={onClose}>
      <div className="emma-task-drawer">
        <nav className="emma-task-drawer__tabs" aria-label="Task sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                tab === item.id
                  ? "emma-task-drawer__tab emma-task-drawer__tab--active pg-focus-premium"
                  : "emma-task-drawer__tab pg-focus-premium"
              }
              onClick={() => onTabChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <div className="emma-task-drawer__panel">
            <p className="emma-card-label">Status</p>
            <p className="emma-card-value">{model.statusLabel}</p>
            <p className="emma-card-label">Channel</p>
            <p className="emma-card-value">{model.channel}</p>
            {model.objective && (
              <>
                <p className="emma-card-label">Objective</p>
                <p className="emma-card-value">{model.objective}</p>
              </>
            )}
            {model.audience && (
              <>
                <p className="emma-card-label">Audience</p>
                <p className="emma-card-value">{model.audience}</p>
              </>
            )}
            <p className="emma-card-label">Started</p>
            <p className="emma-card-value">{model.startedLabel}</p>
          </div>
        )}

        {tab === "timeline" && (
          <ol className="emma-task-drawer__timeline">
            {model.timeline.length === 0 ? (
              <li className="emma-voice emma-voice--muted">No activity yet.</li>
            ) : (
              model.timeline.map((entry) => (
                <li key={entry.id} className="emma-task-drawer__timeline-item">
                  <span className="emma-task-drawer__timeline-time">{entry.timeLabel}</span>
                  <div>
                    <p className="emma-card-value">{entry.label}</p>
                    <p className="emma-voice emma-voice--muted">{entry.note}</p>
                  </div>
                </li>
              ))
            )}
          </ol>
        )}

        {tab === "files" && (
          <ul className="emma-task-drawer__files">
            {model.files.length === 0 ? (
              <li className="emma-voice emma-voice--muted">Files will appear as Emma generates them.</li>
            ) : (
              model.files.map((file) => (
                <li key={file.id}>
                  <button
                    type="button"
                    className="emma-task-drawer__file pg-focus-premium"
                    onClick={() => onOpenFile?.(file.refId)}
                  >
                    <span>{file.label}</span>
                    <span>{file.openLabel}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === "reasoning" && (
          <div className="emma-task-drawer__panel">
            {model.reasoning.length === 0 ? (
              <p className="emma-voice emma-voice--muted">
                Emma will explain her choices once the draft is ready.
              </p>
            ) : (
              <ul className="emma-task-drawer__reasoning">
                {model.reasoning.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "comments" && (
          <div className="emma-task-drawer__panel">
            <p className="emma-voice emma-voice--muted">
              Leave feedback or ask Emma to adjust this project.
            </p>
            <button
              type="button"
              className="emma-task-drawer__action pg-focus-premium"
              onClick={() => onMessageEmma?.(model.title)}
            >
              Message Emma about this project
            </button>
          </div>
        )}

        {tab === "publishing" && (
          <div className="emma-task-drawer__panel">
            {preview && (
              <div className="emma-task-drawer__preview">
                <DeliverablePreview preview={preview} variant="hero" />
              </div>
            )}
            {model.draftId && model.canPublish && !model.isPublished && (
              <button
                type="button"
                className="emma-task-drawer__action pg-focus-premium"
                onClick={() => onPreparePublish?.(model.draftId!)}
              >
                Prepare for publishing
              </button>
            )}
            {model.draftId && model.isPublished && (
              <p className="emma-voice">This task has been published.</p>
            )}
            {model.draftId && !model.canPublish && !model.isPublished && (
              <p className="emma-voice emma-voice--muted">
                Approve the deliverable before publishing.
              </p>
            )}
          </div>
        )}

        {tab === "performance" && (
          <div className="emma-task-drawer__panel">
            {model.isPublished ? (
              <Link href={model.performanceHref} className="emma-task-drawer__link pg-focus-premium">
                See results for this project
                <ArrowRight size={14} aria-hidden />
              </Link>
            ) : (
              <p className="emma-voice emma-voice--muted">
                Results appear after Emma publishes and your channels are connected.
              </p>
            )}
          </div>
        )}

        {tab === "history" && (
          <ol className="emma-task-drawer__timeline">
            {model.timeline.length === 0 ? (
              <li className="emma-voice emma-voice--muted">No history yet.</li>
            ) : (
              model.timeline.map((entry) => (
                <li key={`hist-${entry.id}`} className="emma-task-drawer__timeline-item">
                  <span className="emma-task-drawer__timeline-time">{entry.timeLabel}</span>
                  <div>
                    <p className="emma-card-value">{entry.label}</p>
                    <p className="emma-voice emma-voice--muted">{entry.note}</p>
                  </div>
                </li>
              ))
            )}
          </ol>
        )}
      </div>
    </PgAlcove>
  );
}
