import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, IBM_Plex_Mono } from "next/font/google";
import { AccountProvider } from "@/components/account/AccountProvider";
import ThemeScript from "@/components/theme/ThemeScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-v17-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-v17-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Peergent — AI Workforce",
  description: "Hire AI colleagues who work like members of your team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-pg-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="relative flex min-h-full flex-col bg-[var(--pg-bg)] text-[var(--pg-text)]">
        <div className="pg-bright-atmosphere" aria-hidden>
          <div className="pg-bright-atmosphere__ambient" />
        </div>
        <ThemeProvider>
          <AccountProvider>{children}</AccountProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
