import type { WebsiteIntelligenceReport } from "./types";

function titleCase(value: string) {
  return value
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferIndustry(hostname: string) {
  const lower = hostname.toLowerCase();

  if (lower.includes("shop") || lower.includes("store") || lower.includes("retail")) {
    return "E-commerce & Retail";
  }

  if (lower.includes("health") || lower.includes("care") || lower.includes("med")) {
    return "Healthcare & Wellness";
  }

  if (lower.includes("finance") || lower.includes("bank") || lower.includes("pay")) {
    return "Financial Services";
  }

  if (lower.includes("tech") || lower.includes("software") || lower.includes("saas")) {
    return "Technology & SaaS";
  }

  return "Professional Services";
}

export function buildDemoReport(
  url: string,
  hostname: string
): WebsiteIntelligenceReport {
  const companyName = titleCase(hostname.split(".")[0] ?? hostname);
  const industry = inferIndustry(hostname);

  return {
    url,
    companyName,
    industry,
    summary: `${companyName} operates in ${industry.toLowerCase()} with a digital presence centered on ${hostname}. Our analysis identified high-value moments where AI employees can capture demand, resolve questions faster, and keep revenue workflows moving without adding headcount.`,
    insights: [
      {
        title: "Inbound interest is under-captured",
        description:
          "The site shows strong product positioning but limited always-on qualification. Visitors likely leave before a human can respond.",
        icon: "traffic",
      },
      {
        title: "Support load appears repeatable",
        description:
          "FAQ-style content and policy pages suggest a large share of customer questions could be handled automatically.",
        icon: "support",
      },
      {
        title: "Content engine has room to scale",
        description:
          "Blog, case study, or resource sections indicate marketing output that an AI employee could accelerate.",
        icon: "content",
      },
      {
        title: "Conversion moments need coverage",
        description:
          "Demo, contact, and booking flows are prime targets for an AI peer that follows up and schedules next steps.",
        icon: "sales",
      },
    ],
    opportunities: [
      {
        area: "Lead qualification",
        score: 92,
        detail: "Website visitors can be engaged, qualified, and routed to sales automatically.",
      },
      {
        area: "Customer support",
        score: 87,
        detail: "Common questions can be resolved instantly using site and knowledge content.",
      },
      {
        area: "Content production",
        score: 74,
        detail: "Campaign and social content can be drafted from existing brand material.",
      },
      {
        area: "Meeting scheduling",
        score: 81,
        detail: "Booking and reminder workflows can run end-to-end with human approval gates.",
      },
    ],
    recommendations: [
      {
        employeeType: "Sales Employee",
        role: "Sales",
        name: "Sales Peer",
        priority: "high",
        rationale:
          "Your website attracts visitors who need immediate answers and qualification before they book or buy.",
        estimatedImpact: "3–5x faster lead response",
        suggestedObjective:
          `Qualify visitors on ${hostname}, answer product questions, and book meetings with the sales team.`,
        gradient: "from-violet-500 to-blue-600",
      },
      {
        employeeType: "Customer Success Employee",
        role: "Support",
        name: "Support Peer",
        priority: "high",
        rationale:
          "Policy, pricing, and product pages indicate recurring customer questions that can be automated.",
        estimatedImpact: "40–60% ticket deflection",
        suggestedObjective:
          `Answer customer questions about ${companyName} using website content and approved knowledge sources.`,
        gradient: "from-cyan-500 to-blue-600",
      },
      {
        employeeType: "Marketing Employee",
        role: "Marketing",
        name: "Marketing Peer",
        priority: "medium",
        rationale:
          "Existing content structure suggests room to scale campaigns and thought leadership output.",
        estimatedImpact: "2x content output",
        suggestedObjective:
          `Create on-brand marketing content and campaign drafts aligned with ${companyName}'s positioning.`,
        gradient: "from-fuchsia-500 to-violet-600",
      },
      {
        employeeType: "Planner",
        role: "Planning",
        name: "Planning Peer",
        priority: "optional",
        rationale:
          "Scheduling workflows become more valuable once sales and support peers begin generating meetings.",
        estimatedImpact: "15+ hours saved weekly",
        suggestedObjective:
          "Manage appointment scheduling, reminders, and calendar coordination for inbound requests.",
        gradient: "from-orange-500 to-pink-600",
      },
    ],
    analyzedAt: new Date().toISOString(),
  };
}
