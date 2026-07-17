import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AccountProvider } from "@/components/account/AccountProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
