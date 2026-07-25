"use client";

import { useEffect, useState } from "react";

export function CcStatusPill() {
  const [label, setLabel] = useState("Workforce active");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      setLabel(`Workforce active · ${h}:${m}`);
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="command-center__status-pill" role="status">
      <span className="command-center__live-dot" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
