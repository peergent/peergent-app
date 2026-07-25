import type { HqLandingViewModel } from "@/lib/hq/build-hq-view-model";

export type HqGreetingProps = {
  viewModel: HqLandingViewModel;
};

export default function HqGreeting({ viewModel }: HqGreetingProps) {
  return (
    <section className="hq-landing__hero" aria-labelledby="hq-greeting-title">
      <p className="hq-landing__eyebrow">
        AI WORKFORCE —{" "}
        <time dateTime={viewModel.initialDateTime}>{viewModel.initialDateLabel.toUpperCase()}</time>
      </p>
      <h1 id="hq-greeting-title" className="hq-landing__headline">
        {viewModel.greetingTime}, {viewModel.greetingName}.
        <br />
        Your team is <span className="hq-landing__headline-grad">awake</span>.
      </h1>
      <p className="hq-landing__subhead">{viewModel.subhead}</p>
    </section>
  );
}
