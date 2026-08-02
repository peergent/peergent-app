/**
 * Context-aware campaign simulation content.
 * All copy derives from CampaignContext — never from unrelated fixture strings.
 */
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { CampaignSetupChannel } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignContext } from "./campaign-context";

export type SimulatedDeliverableSpec = {
  channel: CampaignSetupChannel | "newsletter" | "website_landing";
  contentType: MarketingContentDraft["contentType"];
  titleKey: "linkedin" | "email" | "newsletter" | "ads" | "landing";
};

export type SimulatedCopyBundle = {
  objective: string;
  linkedinTitle: string;
  linkedinBody: string;
  emailSubject: string;
  emailBody: string;
  newsletterTitle: string;
  newsletterBody: string;
  adsBody: string;
  landingBody: string;
  channelRationale: Record<string, string>;
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function audiencePhrase(ctx: CampaignContext): string {
  if (ctx.audience.trim()) return ctx.audience.trim();
  return ctx.locale === "nl" ? "je doelgroep" : "your target audience";
}

function goalPhrase(ctx: CampaignContext): string {
  if (ctx.goals.length > 0) return ctx.goals.join(", ");
  return ctx.campaignName;
}

function companyPhrase(ctx: CampaignContext): string {
  return ctx.companyName;
}

function leadFocused(ctx: CampaignContext): boolean {
  return (
    ctx.goals.some((g) => /lead|demo|aanvr/i.test(g)) ||
    /lead|demo|aanvr/i.test(ctx.description)
  );
}

export function resolveDeliverableChannelsFromMode(ctx: CampaignContext): string[] {
  return [...new Set(resolveDeliverableSpecs(ctx).map((s) => s.channel))];
}

export function resolveDeliverableSpecs(ctx: CampaignContext): SimulatedDeliverableSpec[] {
  if (ctx.isSeedCampaign) {
    return [
      { channel: "linkedin", contentType: "linkedin_post", titleKey: "linkedin" },
      { channel: "email", contentType: "newsletter", titleKey: "email" },
      { channel: "newsletter", contentType: "newsletter", titleKey: "newsletter" },
      { channel: "google_ads", contentType: "google_ads_copy", titleKey: "ads" },
      { channel: "website_landing", contentType: "blog_article", titleKey: "landing" },
    ];
  }

  if (ctx.campaignMode === "manual" && ctx.selectedChannels.length > 0) {
    const specs: SimulatedDeliverableSpec[] = [];
    for (const ch of ctx.selectedChannels) {
      if (ch === "linkedin") specs.push({ channel: "linkedin", contentType: "linkedin_post", titleKey: "linkedin" });
      if (ch === "email") specs.push({ channel: "email", contentType: "newsletter", titleKey: "email" });
      if (ch === "google_ads") specs.push({ channel: "google_ads", contentType: "google_ads_copy", titleKey: "ads" });
      if (ch === "website_landing") specs.push({ channel: "website_landing", contentType: "blog_article", titleKey: "landing" });
      if (ch === "blog") specs.push({ channel: "blog", contentType: "blog_article", titleKey: "landing" });
      if (ch === "instagram") specs.push({ channel: "instagram", contentType: "linkedin_post", titleKey: "linkedin" });
    }
    if (specs.length > 0) return specs;
  }

  const specs: SimulatedDeliverableSpec[] = [
    { channel: "linkedin", contentType: "linkedin_post", titleKey: "linkedin" },
    { channel: "email", contentType: "newsletter", titleKey: "email" },
  ];
  if (leadFocused(ctx)) {
    specs.push({ channel: "google_ads", contentType: "google_ads_copy", titleKey: "ads" });
    specs.push({ channel: "website_landing", contentType: "blog_article", titleKey: "landing" });
  } else {
    specs.push({ channel: "newsletter", contentType: "newsletter", titleKey: "newsletter" });
  }
  return specs;
}

export function generateSimulatedCopy(ctx: CampaignContext): SimulatedCopyBundle {
  const nl = ctx.locale === "nl";
  const audience = audiencePhrase(ctx);
  const goal = goalPhrase(ctx);
  const company = companyPhrase(ctx);
  const desc = ctx.description.trim();
  const wantsDemo = leadFocused(ctx);

  const objective = nl
    ? `${goal} — gericht op ${audience}`
    : `${goal} — aimed at ${audience}`;

  const linkedinTitle = nl
    ? truncate(`Waarom ${audience} nu naar ${company} kijken`, 120)
    : truncate(`Why ${audience} should look at ${company} now`, 120);

  const linkedinBody = nl
    ? `${desc || `Ik help ${company} om ${goal.toLowerCase()} te bereiken bij ${audience}.`}\n\nMijn voorstel: praktische content die vertrouwen opbouwt vóór we om actie vragen.\n\nHashtags: #${company.replace(/\s+/g, "")} #marketing #${wantsDemo ? "demo" : "groei"}\nCTA: ${wantsDemo ? "Plan een demo →" : "Meer lezen →"}`
    : `${desc || `I'm helping ${company} reach ${goal.toLowerCase()} with ${audience}.`}\n\nMy approach: practical content that builds trust before we ask for action.\n\nHashtags: #${company.replace(/\s+/g, "")} #marketing #${wantsDemo ? "demo" : "growth"}\nCTA: ${wantsDemo ? "Book a demo →" : "Learn more →"}`;

  const emailSubject = truncate(`${company}: ${wantsDemo ? "Plan een demo" : goal}`, 80);

  const emailBody = nl
    ? `From: Emma — ${company} <emma@${company.toLowerCase().replace(/\s+/g, "")}.nl>\nTo: ${audience}\nSubject: ${emailSubject}\nPreheader: ${truncate(desc || goal, 90)}\nCTA: ${wantsDemo ? "Plan een demo" : "Meer lezen"}\n---\nHallo,\n\n${desc || `Ik werk aan een campagne om ${goal.toLowerCase()} te bereiken bij ${audience}.`}\n\nIn deze e-mail leg ik kort uit waarom ${company} relevant is voor jouw situatie — en wat de logische volgende stap is.\n\n${wantsDemo ? "Wil je zien hoe dit in de praktijk werkt? Plan een korte demo." : "Wil je meer weten? Klik op de knop hieronder."}\n\nMet vriendelijke groet,\nEmma\n${company}\n\n---\nUitschrijven · Privacy · ${company}`
    : `From: Emma — ${company} <emma@${company.toLowerCase().replace(/\s+/g, "")}.com>\nTo: ${audience}\nSubject: ${emailSubject}\nPreheader: ${truncate(desc || goal, 90)}\nCTA: ${wantsDemo ? "Book a demo" : "Learn more"}\n---\nHi,\n\n${desc || `I'm building a campaign to ${goal.toLowerCase()} with ${audience}.`}\n\nIn this email I briefly explain why ${company} is relevant for your situation — and what the logical next step is.\n\n${wantsDemo ? "Want to see how this works in practice? Book a short demo." : "Want to know more? Click the button below."}\n\nBest regards,\nEmma\n${company}\n\n---\nUnsubscribe · Privacy · ${company}`;

  const newsletterTitle = `${company}: ${truncate(goal, 60)}`;

  const newsletterBody = nl
    ? truncate(desc || `Updates over hoe we ${goal.toLowerCase()} bereiken bij ${audience}.`, 280)
    : truncate(desc || `Updates on how we ${goal.toLowerCase()} with ${audience}.`, 280);

  const adsBody = nl
    ? `Campaign: ${ctx.campaignName}\nAd group: ${audience}\n\nHeadline 1: ${truncate(company, 30)}\nHeadline 2: ${truncate(goal, 30)}\nHeadline 3: ${wantsDemo ? "Plan een demo" : "Meer informatie"}\nDescription 1: ${truncate(desc || objective, 90)}\nDescription 2: Gericht op ${audience}\nKeywords: ${company}, ${goal}\n---\nPreview: ${company} · ${truncate(goal, 40)}`
    : `Campaign: ${ctx.campaignName}\nAd group: ${audience}\n\nHeadline 1: ${truncate(company, 30)}\nHeadline 2: ${truncate(goal, 30)}\nHeadline 3: ${wantsDemo ? "Book a demo" : "Learn more"}\nDescription 1: ${truncate(desc || objective, 90)}\nDescription 2: Aimed at ${audience}\nKeywords: ${company}, ${goal}\n---\nPreview: ${company} · ${truncate(goal, 40)}`;

  const landingBody = nl
    ? `Hero: ${company}\nSub: ${goal}\nSection 1: Voor ${audience}\nSection 2: ${truncate(desc || objective, 120)}\nSection 3: Waarom nu\nSection 4: Veelgestelde vragen — Hoe snel kan ik starten? · Wat kost het? · Past dit bij mijn team?\nSection 5: Social proof — "Bespaart ons uren per week"\nCTA: ${wantsDemo ? "Plan een demo" : "Neem contact op"}\nSEO title: ${company} — ${goal}\nSEO description: ${truncate(desc || objective, 160)}`
    : `Hero: ${company}\nSub: ${goal}\nSection 1: For ${audience}\nSection 2: ${truncate(desc || objective, 120)}\nSection 3: Why now\nSection 4: FAQ — How fast can I start? · What does it cost? · Is this right for my team?\nSection 5: Social proof — "Saves us hours every week"\nCTA: ${wantsDemo ? "Book a demo" : "Get in touch"}\nSEO title: ${company} — ${goal}\nSEO description: ${truncate(desc || objective, 160)}`;

  const channelRationale: Record<string, string> = {
    linkedin: nl
      ? `Je doelgroep (${audience}) is actief op LinkedIn voor zakelijke beslissingen en peer-advies.`
      : `Your audience (${audience}) is active on LinkedIn for business decisions and peer advice.`,
    email: nl
      ? `E-mail helpt geïnteresseerden verder richting ${wantsDemo ? "een demo of afspraak" : "meer informatie"}.`
      : `Email guides interested people toward ${wantsDemo ? "a demo or meeting" : "more information"}.`,
    newsletter: nl
      ? `Nieuwsbrief houdt bestaande contacten betrokken met dezelfde boodschap.`
      : `Newsletter keeps existing contacts engaged with the same message.`,
    google_ads: nl
      ? `Hiermee bereiken we mensen die al actief zoeken naar een oplossing zoals ${company} biedt.`
      : `This reaches people actively searching for a solution like ${company} offers.`,
    website_landing: nl
      ? `Landingspagina zet traffic om naar ${wantsDemo ? "demo-aanvragen" : "conversie"}.`
      : `Landing page converts traffic into ${wantsDemo ? "demo requests" : "conversions"}.`,
    instagram: nl
      ? `Instagram kan merkbekendheid versterken bij ${audience}.`
      : `Instagram can strengthen brand awareness with ${audience}.`,
    blog: nl
      ? `Blogcontent ondersteunt vindbaarheid en vertrouwen op de lange termijn.`
      : `Blog content supports discoverability and long-term trust.`,
  };

  return {
    objective,
    linkedinTitle,
    linkedinBody,
    emailSubject,
    emailBody,
    newsletterTitle,
    newsletterBody,
    adsBody,
    landingBody,
    channelRationale,
  };
}

export function channelRationaleFor(
  ctx: CampaignContext,
  channel: string,
  copy: SimulatedCopyBundle
): string {
  return copy.channelRationale[channel] ?? copy.objective;
}
