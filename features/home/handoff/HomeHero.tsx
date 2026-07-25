type HomeHeroProps = {
  personalGreeting: string;
  headline: string;
  visible?: boolean;
};

export default function HomeHero({ personalGreeting, headline, visible = true }: HomeHeroProps) {
  return (
    <header
      className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <p className="home-greeting text-[15px] font-medium">{personalGreeting}</p>
      <h1 className="home-headline mt-3 max-w-[720px] text-[clamp(1.75rem,4vw,2.375rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--pg-color-text-primary)]">
        {headline}
      </h1>
    </header>
  );
}
