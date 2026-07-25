export { CcTopBar as CommandCenterHeader } from "./components/CcTopBar";

export const COMMAND_CENTER_BACK_HREF = "/hq";

export function CommandCenterIntro() {
  return (
    <header className="command-center__cc-header">
      <p className="command-center__eyebrow">LIVE OVERVIEW</p>
      <h1 className="command-center__cc-title">Command Center</h1>
      <p className="command-center__cc-sub">
        Everything your team is working on, what needs you, and the impact it&apos;s having — explained, not guessed.
      </p>
    </header>
  );
}
