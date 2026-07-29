import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
export type V17SettingsRowModel = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type V17SettingsViewModel = {
  title: string;
  rows: V17SettingsRowModel[];
};

export function buildV17SettingsViewModel(input: {
  peerId: string;
  localePreference?: string | null;
}): V17SettingsViewModel {
  const locale = resolveCustomerLocalePreference(input.localePreference) as MarketingCampaignLocale;
  const copy = getV17PeerCopy(locale);
  const { peerId } = input;

  const rows: V17SettingsRowModel[] = [
    {
      id: "brand",
      title: copy.settingsBrand,
      description: copy.settingsBrandDesc,
      href: `/team/${peerId}/settings?section=knowledge`,
    },
    {
      id: "company",
      title: copy.settingsCompany,
      description: copy.settingsCompanyDesc,
      href: `/team/${peerId}/settings?section=knowledge`,
    },
    {
      id: "connections",
      title: copy.settingsConnections,
      description: copy.settingsConnectionsDesc,
      href: `/team/${peerId}/settings?section=connections`,
    },
    { id: "responsibilities", title: copy.settingsResponsibilities, description: copy.settingsResponsibilitiesDesc, href: `/team/${peerId}/settings?section=responsibilities` },
    { id: "autonomy", title: copy.settingsAutonomy, description: copy.settingsAutonomyDesc, href: `/team/${peerId}/settings?section=autonomy` },
    { id: "approvals", title: copy.settingsApprovals, description: copy.settingsApprovalsDesc, href: `/team/${peerId}/settings?section=autonomy` },
    { id: "notifications", title: copy.settingsNotifications, description: copy.settingsNotificationsDesc, href: `/team/${peerId}/settings?section=notifications` },
    { id: "advanced", title: copy.settingsAdvanced, description: copy.settingsAdvancedDesc, href: `/team/${peerId}/settings?section=advanced` },
  ];

  return { title: copy.settingsTitle, rows };
}
