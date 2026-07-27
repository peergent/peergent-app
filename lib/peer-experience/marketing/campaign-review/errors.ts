export class CampaignReviewBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampaignReviewBuildError";
  }
}
