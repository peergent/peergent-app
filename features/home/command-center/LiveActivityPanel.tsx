import Link from "next/link";
import type { CcActivityItem } from "@/lib/home/build-command-center-view-model";

export function LiveActivityPanel({ items }: { items: CcActivityItem[] }) {
  return (
    <section className="command-center__panel command-center__glass" aria-labelledby="cc-activity-title">
      <div className="command-center__panel-head">
        <h2 className="command-center__panel-title" id="cc-activity-title">
          Live activity
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="command-center__activity-text">No recent movement yet.</p>
      ) : (
        <div className="command-center__activity-list command-center__activity-list--compact">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="command-center__activity-item pg-focus-premium">
              <span
                className={`command-center__activity-dot command-center__activity-dot--${item.serviceKey}`}
                aria-hidden
              />
              <p className="command-center__activity-text">
                <strong>{item.agentLabel}</strong> {item.text}
              </p>
              <span className="command-center__activity-time">{item.timeLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
