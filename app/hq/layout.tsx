import { Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export default function HqLayout({ children }: { children: ReactNode }) {
  return <div className={spaceGrotesk.className}>{children}</div>;
}
