import WorkspacePanel from "@/components/peer-detail/WorkspacePanel";

export default function MarketingWorkspaceSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-40 rounded-[24px] bg-white/[0.04]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-[24px] bg-white/[0.03]" />
        <div className="h-64 rounded-[24px] bg-white/[0.03]" />
        <div className="h-72 rounded-[24px] bg-white/[0.03]" />
        <div className="h-72 rounded-[24px] bg-white/[0.03]" />
      </div>
    </div>
  );
}

export function MarketingPanelSkeleton() {
  return (
    <WorkspacePanel title="Loading…">
      <div className="space-y-3">
        <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-white/[0.04]" />
        <div className="h-4 w-5/6 rounded bg-white/[0.04]" />
      </div>
    </WorkspacePanel>
  );
}
