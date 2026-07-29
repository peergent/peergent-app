"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { V17SettingsViewModel } from "@/lib/customer-v17/build-v17-settings-view-model";

export default function V17SettingsView({ model }: { model: V17SettingsViewModel }) {
  return (
    <div className="v17-section-page" data-testid="v17-settings-view">
      <h2 className="v17-section-page-title">{model.title}</h2>
      {model.rows.map((row) => (
        <Link key={row.id} href={row.href} className="v17-settings-row pg-focus-premium">
          <div>
            <div className="v17-settings-name">{row.title}</div>
            <div className="v17-settings-desc">{row.description}</div>
          </div>
          <ChevronRight size={16} aria-hidden className="v17-settings-chevron" />
        </Link>
      ))}
    </div>
  );
}
