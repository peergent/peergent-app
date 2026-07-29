"use client";

import Link from "next/link";
import type { V17DoneViewModel } from "@/lib/customer-v17/build-v17-done-view-model";

export default function V17DoneView({ model }: { model: V17DoneViewModel }) {
  const copy = model.copy;

  return (
    <div className="v17-section-page" data-testid="v17-done-view">
      <h2 className="v17-section-page-title">{copy.todayDoneHeading}</h2>

      {model.groups.length === 0 ? (
        <>
          <p className="v17-brief-focus" style={{ fontSize: 16, fontStyle: "normal" }}>
            {model.emptyHeadline}
          </p>
          <p className="v17-page-support">{model.emptyBody}</p>
        </>
      ) : (
        model.groups.map((group) => (
          <section key={group.id} className="v17-today-block" data-testid={`v17-done-group-${group.id}`}>
            <h3 className="v17-today-block-title">{group.title}</h3>
            {group.items.map((item) => (
              <div key={item.id} className="v17-done-row">
                <span className="v17-done-ico" aria-hidden>
                  ✓
                </span>
                {item.href ? (
                  <Link href={item.href} className="v17-done-label pg-focus-premium">
                    {item.label}
                  </Link>
                ) : (
                  <span className="v17-done-label">{item.label}</span>
                )}
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
