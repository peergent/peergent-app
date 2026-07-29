import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ peerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KnowledgeRedirectPage({ params, searchParams }: Props) {
  const { peerId } = await params;
  const sp = await searchParams;
  const section = sp.section;
  if (typeof section === "string") {
    redirect(`/team/${peerId}/settings?section=${encodeURIComponent(section)}`);
  }
  redirect(`/team/${peerId}/settings?section=knowledge`);
}
