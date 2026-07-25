const STORAGE_PREFIX = "peergent-peer-settings:";

export type PeerResponsibilityId =
  | "linkedin"
  | "instagram"
  | "seo"
  | "blogs"
  | "email_marketing"
  | "google_ads"
  | "meta_ads"
  | "landing_pages"
  | "newsletters";

export type PeerSettings = {
  peerId: string;
  responsibilities: Record<PeerResponsibilityId, boolean>;
  updatedAt: string;
};

export const PEER_RESPONSIBILITY_LABELS: Record<PeerResponsibilityId, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  seo: "SEO",
  blogs: "Blogs",
  email_marketing: "Email Marketing",
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  landing_pages: "Landing Pages",
  newsletters: "Newsletters",
};

export function defaultPeerSettings(peerId: string): PeerSettings {
  return {
    peerId,
    responsibilities: {
      linkedin: true,
      instagram: true,
      seo: true,
      blogs: true,
      email_marketing: true,
      google_ads: false,
      meta_ads: false,
      landing_pages: true,
      newsletters: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function loadPeerSettings(peerId: string): PeerSettings {
  if (typeof window === "undefined") return defaultPeerSettings(peerId);
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${peerId}`);
    if (!raw) return defaultPeerSettings(peerId);
    return JSON.parse(raw) as PeerSettings;
  } catch {
    return defaultPeerSettings(peerId);
  }
}

export function savePeerSettings(settings: PeerSettings): PeerSettings {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      `${STORAGE_PREFIX}${settings.peerId}`,
      JSON.stringify({ ...settings, updatedAt: new Date().toISOString() })
    );
  }
  return settings;
}

export function togglePeerResponsibility(
  settings: PeerSettings,
  id: PeerResponsibilityId
): PeerSettings {
  return savePeerSettings({
    ...settings,
    responsibilities: {
      ...settings.responsibilities,
      [id]: !settings.responsibilities[id],
    },
    updatedAt: new Date().toISOString(),
  });
}
