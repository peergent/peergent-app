"use client";

import { useMemo, useState } from "react";
import type { PeerRow } from "@/lib/peer-display";
import {
  displayWebsite,
  filterPeersByQuery,
  groupPeersByWebsite,
} from "@/lib/dev/prompt-playground-utils";

type PromptPeerSelectorProps = {
  peers: PeerRow[];
  selectedPeerId: string;
  onSelectPeer: (peerId: string) => void;
  disabled?: boolean;
};

export default function PromptPeerSelector({
  peers,
  selectedPeerId,
  onSelectPeer,
  disabled = false,
}: PromptPeerSelectorProps) {
  const [query, setQuery] = useState("");

  const filteredPeers = useMemo(
    () => filterPeersByQuery(peers, query),
    [peers, query]
  );

  const groupedPeers = useMemo(
    () => groupPeersByWebsite(filteredPeers),
    [filteredPeers]
  );

  return (
    <div className="space-y-3">
      <label htmlFor="prompt-peer-search" className="text-xs uppercase tracking-wide text-slate-500">
        Search peers
      </label>
      <input
        id="prompt-peer-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by website or peer name"
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/40"
      />

      <div className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-[#050816]">
        {groupedPeers.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No peers match your search.</p>
        ) : (
          groupedPeers.map((group) => (
            <div key={group.normalizedWebsite || group.website} className="border-b border-white/5 last:border-b-0">
              <div className="sticky top-0 bg-[#070b18]/95 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 backdrop-blur">
                {group.website}
              </div>
              <ul>
                {group.peers.map((peer) => {
                  const selected = peer.id === selectedPeerId;

                  return (
                    <li key={peer.id}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectPeer(peer.id)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                          selected
                            ? "bg-violet-500/10 text-white"
                            : "text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{peer.name}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {displayWebsite(peer.website)} · {peer.role}
                          </span>
                        </span>
                        {selected ? (
                          <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-200">
                            Selected
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
