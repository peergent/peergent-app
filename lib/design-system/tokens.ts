/**
 * Peergent Design System — semantic token reference.
 * Runtime source: app/themes/peergent-tokens.css
 */

export const theme = {
  bg: "var(--pg-bg)",
  bgMuted: "var(--pg-bg-muted)",
  surface: "var(--pg-surface)",
  surfaceSolid: "var(--pg-surface-solid)",
  surfaceHover: "var(--pg-surface-hover)",
  border: "var(--pg-border)",
  borderSoft: "var(--pg-border-soft)",
  text: "var(--pg-text)",
  textMuted: "var(--pg-text-muted)",
  inputBg: "var(--pg-input-bg)",
  inputBorder: "var(--pg-input-border)",
  inputText: "var(--pg-input-text)",
  placeholder: "var(--pg-input-placeholder)",
  labelText: "var(--pg-label-text)",
  panelBg: "var(--pg-panel-bg)",
  panelBorder: "var(--pg-panel-border)",
  accent: "var(--pg-accent)",
  shadow: "var(--pg-shadow)",
  gradient: "var(--pg-gradient)",
  glow: "var(--pg-glow)",
} as const;

export const bright = {
  bg: "var(--pg-bright-bg)",
  ambient: "var(--pg-bright-ambient)",
  heroSpot: "var(--pg-bright-hero-spot)",
  glass: "var(--pg-bright-glass)",
  glassPrimary: "var(--pg-bright-glass-primary)",
  border: "var(--pg-bright-border)",
  borderAccent: "var(--pg-bright-border-accent)",
  shadow: "var(--pg-bright-shadow)",
  shadowPrimary: "var(--pg-bright-shadow-primary)",
  accent: "var(--pg-bright-accent)",
} as const;

export const cardHierarchy = {
  primaryBg: "var(--pg-card-primary-bg)",
  primaryBorder: "var(--pg-card-primary-border)",
  primaryShadow: "var(--pg-card-primary-shadow)",
  secondaryBg: "var(--pg-card-secondary-bg)",
  secondaryBorder: "var(--pg-card-secondary-border)",
  utilityBg: "var(--pg-card-utility-bg)",
  utilityBorder: "var(--pg-card-utility-border)",
} as const;

export const color = {
  ...theme,
  bgPrimary: "var(--pg-bg)",
  bgSecondary: "var(--pg-bg-muted)",
  canvas: "var(--pg-color-canvas)",
  elevated: "var(--pg-color-elevated)",
  borderSubtle: "var(--pg-color-border-subtle)",
  divider: "var(--pg-color-divider)",
  textPrimary: "var(--pg-text)",
  textSecondary: "var(--pg-text-muted)",
  textTertiary: "var(--pg-text-subtle)",
  textDisabled: "var(--pg-color-text-disabled)",
  accentHover: "var(--pg-color-accent-hover)",
  accentPressed: "var(--pg-color-accent-pressed)",
  accentMuted: "var(--pg-color-accent-muted)",
  success: "var(--pg-color-success)",
  warning: "var(--pg-color-warning)",
  error: "var(--pg-color-error)",
  info: "var(--pg-color-info)",
  statusWorking: "var(--pg-color-status-working)",
  statusWaiting: "var(--pg-color-status-waiting)",
  statusIdle: "var(--pg-color-status-idle)",
  statusBlocked: "var(--pg-color-status-blocked)",
  statusComplete: "var(--pg-color-status-complete)",
  deptMarketing: "var(--pg-color-dept-marketing, var(--pg-accent))",
  deptSales: "var(--pg-color-dept-sales, var(--pg-info))",
  deptOperations: "var(--pg-color-dept-operations, var(--pg-success))",
  deptFinance: "var(--pg-color-dept-finance, var(--pg-warning))",
  deptSupport: "var(--pg-color-dept-support, var(--pg-success))",
} as const;
