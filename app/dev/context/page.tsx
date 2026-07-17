import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContextPlayground from "@/components/dev/ContextPlayground";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export const metadata: Metadata = {
  title: "Context Engine Playground",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContextPlaygroundPage() {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return <ContextPlayground />;
}
