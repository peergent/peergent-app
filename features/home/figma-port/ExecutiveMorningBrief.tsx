"use client";

import { motion } from "framer-motion";
import type { ExecutiveMorningBrief as ExecutiveMorningBriefModel } from "./executive-brief";
import { ExecutiveBriefProse } from "./ExecutiveDecisionCard";

const motionEase = [0.22, 1, 0.36, 1] as const;

function ExecutiveBriefImpact({ impact }: { impact: NonNullable<ExecutiveMorningBriefModel["impact"]> }) {
  const hours =
    impact.hoursSaved === 1 ? "1 working hour" : `${impact.hoursSaved} working hours`;

  return (
    <>
      This saved you approximately <strong className="executive-brief-emphasis">{hours}</strong> with
      an estimated business value of{" "}
      <strong className="executive-brief-emphasis">
        €{impact.businessValueEur.toLocaleString()}
      </strong>
      .
    </>
  );
}

export default function ExecutiveMorningBrief({
  brief,
  peerNames,
}: {
  brief: ExecutiveMorningBriefModel;
  peerNames: string[];
}) {
  return (
    <>
      <p className="executive-brief-kicker">{brief.kicker}</p>
      <h1 className="executive-brief-greeting">{brief.greeting}</h1>

      {brief.legacyLines?.map((line) => (
        <p key={line} className="brief-prose executive-brief-paragraph">
          {line}
        </p>
      ))}

      {brief.workforceIntro && brief.accomplishments.length > 0 && (
        <motion.p
          className="executive-brief-intro"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: motionEase }}
        >
          {brief.workforceIntro}
        </motion.p>
      )}

      {brief.accomplishments.length > 0 && (
        <motion.ul
          className="executive-brief-accomplishments"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: motionEase }}
        >
          {brief.accomplishments.map((item) => (
            <li key={item.key}>{item.label}</li>
          ))}
        </motion.ul>
      )}

      {brief.impact && (
        <motion.p
          className="executive-brief-impact"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: motionEase }}
        >
          <ExecutiveBriefImpact impact={brief.impact} />
        </motion.p>
      )}

      {brief.fallbackProse && (
        <motion.p
          className="brief-prose executive-brief-paragraph"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: motionEase }}
        >
          <ExecutiveBriefProse text={brief.fallbackProse} peerNames={peerNames} />
        </motion.p>
      )}
    </>
  );
}
