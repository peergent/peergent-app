import { THEME_STORAGE_KEY } from "@/lib/theme/constants";

const themeScript = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var pref = localStorage.getItem(key) || "system";
    var resolved =
      pref === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : pref;
    document.documentElement.setAttribute("data-pg-theme", resolved);
    document.documentElement.setAttribute("data-pg-theme-preference", pref);
  } catch (e) {
    document.documentElement.setAttribute("data-pg-theme", "dark");
  }
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
