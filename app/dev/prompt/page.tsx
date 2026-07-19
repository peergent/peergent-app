import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromptPlayground from "@/components/dev/PromptPlayground";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export const metadata: Metadata = {
  title: "Prompt Builder Playground",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PromptPlaygroundPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <PromptPlayground />;
}
