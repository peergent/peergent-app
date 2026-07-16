import {
  Cloud,
  Database,
  Globe2,
  HardDrive,
  Layers,
} from "lucide-react";
import type { ConnectedSource } from "@/lib/knowledge-demo";

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
      className={`rounded-2xl border p-5 transition ${
        isConnected
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isConnected ? "bg-emerald-500/15" : "bg-white/[0.05]"
          }`}
        >
          <Icon
            size={20}
            className={isConnected ? "text-emerald-400" : "text-slate-400"}
          />
        </div>

        {isConnected ? (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
            Connected
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-500">
            Coming Soon
          </span>
        )}
      </div>

      <h3 className="mt-4 font-semibold">{source.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {source.description}
      </p>

      {isConnected && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {source.documentCount !== undefined && (
            <span>{source.documentCount} pages indexed</span>
          )}
          {source.lastSync && <span>Last sync {source.lastSync}</span>}
        </div>
      )}
    </article>
  );
}
