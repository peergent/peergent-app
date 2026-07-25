/** Preset commands — short labels a founder understands instantly. */
export type DelegationQuickAction = {
  id: string;
  label: string;
  message: string;
};

export const DELEGATION_QUICK_ACTIONS: DelegationQuickAction[] = [
  { id: "instagram", label: "Instagram post", message: "Create an Instagram post with caption and image" },
  { id: "linkedin", label: "LinkedIn post", message: "Write a LinkedIn post for our audience" },
  { id: "blog", label: "Blog", message: "Generate a blog article" },
  { id: "newsletter", label: "Newsletter", message: "Create a newsletter for our subscribers" },
  { id: "seo", label: "SEO audit", message: "Find SEO opportunities and content gaps" },
  { id: "google-ads", label: "Google Ads", message: "Create a Google Ads campaign" },
  { id: "meta", label: "Meta campaign", message: "Create a Meta ads campaign" },
  { id: "email", label: "Email campaign", message: "Create an email marketing campaign" },
  { id: "calendar", label: "Content calendar", message: "Build a content calendar for this month" },
  { id: "competitor", label: "Competitor analysis", message: "Analyse competitor marketing activity" },
];
