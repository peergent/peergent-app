import {
  Cloud,
  Database,
  Globe2,
  HardDrive,
  Layers,
} from "lucide-react";
import type { ConnectedSource } from "@/lib/knowledge-demo";
import { cn } from "@/lib/ui/cn";

type ConnectedSourceCardProps = {
  source: ConnectedSource;
};

const sourceIcons: Record<string, typeof Globe2> = {
  website: Globe2,
  "google-drive": HardDrive,
  notion: Layers,
  sharepoint: Database,
  dropbox: Cloud,
};

export default function ConnectedSourceCard({
  source,
}: ConnectedSourceCardProps) {
  const Icon = sourceIcons[source.id] ?? Cloud;
  const isConnected = source.status === "connected";

  return (
    <article
      className={cn(
        "rounded-2xl border p-5 transition",
        isConnected
          ? "border-[var(--pg-success-border)] bg-[var(--pg-success-muted)]"
          : "border-[var(--pg-panel-border)] bg-[var(--pg-item-panel-bg)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isConnected ? "bg-[var(--pg-success-muted)]" : "bg-[var(--pg-pill-bg)]"
          )}
        >
          <Icon
            size={20}
            className={isConnected ? "text-[var(--pg-success)]" : "text-[var(--pg-text-muted)]"}
          />
        </div>

        {isConnected ? (
          <span className="rounded-full border border-[var(--pg-success-border)] bg-[var(--pg-success-muted)] px-2.5 py-1 text-xs font-medium text-[var(--pg-success)]">
            Connected
          </span>
        ) : (
          <span className="rounded-full border border-[var(--pg-border-soft)] bg-[var(--pg-pill-bg)] px-2.5 py-1 text-xs text-[var(--pg-text-muted)]">
            Coming Soon
          </span>
        )}
      </div>

      <h3 className="mt-4 font-semibold text-[var(--pg-text)]">{source.name}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--pg-text-muted)]">
        {source.description}
      </p>

      {isConnected && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--pg-label-text)]">
          {source.documentCount !== undefined && (
            <span>{source.documentCount} pages indexed</span>
          )}
          {source.lastSync && <span>Last sync {source.lastSync}</span>}
        </div>
      )}
    </article>
  );
}
