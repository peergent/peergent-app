import Link from "next/link";
import type { CcApprovalsPanel } from "@/lib/home/build-command-center-view-model";
import { CcPeerIcon } from "./components/CcPeerIcon";

export function NeedsAttentionPanel({ panel }: { panel: CcApprovalsPanel }) {
  const countLabel =
    panel.pendingCount === 1 ? "1 pending" : `${panel.pendingCount} pending`;

  return (
    <section className="command-center__panel command-center__glass" aria-labelledby="cc-approvals-title">
      <div className="command-center__panel-head">
        <h2 className="command-center__panel-title" id="cc-approvals-title">
          Needs your attention
        </h2>
        <span className="command-center__panel-count">{countLabel}</span>
      </div>
      {panel.pendingCount === 0 ? (
        <p className="command-center__approval-reason">Nothing waiting on you right now.</p>
      ) : (
        <>
          <ul className="command-center__approval-list command-center__approval-list--compact">
            {panel.items.map((item) => (
              <li key={item.id} className="command-center__approval-item">
                <div className="command-center__approval-left">
                  <CcPeerIcon serviceKey={item.serviceKey} />
                  <div className="command-center__approval-text">
                    <p className="command-center__approval-title">{item.title}</p>
                    <p className="command-center__approval-reason">{item.reason}</p>
                  </div>
                </div>
                <div className="command-center__approval-right">
                  {item.confidenceLabel && (
                    <span className="command-center__confidence-pill">{item.confidenceLabel}</span>
                  )}
                  <Link href={item.reviewHref} className="command-center__btn-ghost pg-focus-premium">
                    Review
                  </Link>
                  <Link href={item.href} className="command-center__btn-approve pg-focus-premium">
                    Approve
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {panel.pendingCount > panel.items.length && (
            <Link href={panel.viewAllHref} className="command-center__view-all pg-focus-premium">
              View all
            </Link>
          )}
        </>
      )}
    </section>
  );
}
