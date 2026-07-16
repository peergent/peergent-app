import Link from "next/link";
import { ArrowRight, Bot, ScanSearch, Users } from "lucide-react";
import ButtonLink from "@/components/ui/ButtonLink";
import ReportChapter from "@/components/dashboard/ReportChapter";
import Skeleton from "@/components/ui/Skeleton";
import WorkforcePeerRow from "@/components/dashboard/WorkforcePeerRow";
import type { PeerRow } from "@/lib/peer-display";

type WorkforcePanelProps = {
  peers: PeerRow[];
  loading: boolean;
};

export default function WorkforcePanel({ peers, loading }: WorkforcePanelProps) {
  return (
    <ReportChapter
      step={5}
      icon={Users}
      title="Who's already working"
      action={
        peers.length > 0 ? (
          <Link
            href="/peers"
            className="inline-flex items-center gap-2 text-sm text-violet-400/80 transition hover:text-violet-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
          >
            All colleagues
            <ArrowRight size={16} />
          </Link>
        ) : undefined
      }
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-[var(--pg-radius-lg)]" />
          <Skeleton className="h-24 w-full rounded-[var(--pg-radius-lg)]" />
        </div>
      ) : peers.length === 0 ? (
        <div className="max-w-xl">
          <p className="text-sm leading-6 text-slate-500">
            No peers deployed — I cannot observe internal work yet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink
              href="/website-intelligence"
              variant="primary"
              leftIcon={<ScanSearch size={16} />}
            >
              See website analysis
            </ButtonLink>
            <ButtonLink href="/peers" variant="secondary">
              Create AI Peer
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {peers.map((peer) => (
            <li key={peer.id}>
              <WorkforcePeerRow peer={peer} />
            </li>
          ))}
        </ul>
      )}
    </ReportChapter>
  );
}
