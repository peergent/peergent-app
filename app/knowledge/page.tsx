import { redirect } from "next/navigation";

type KnowledgeRedirectPageProps = {
  searchParams: Promise<{ section?: string }>;
};

export default async function KnowledgeRedirectPage({ searchParams }: KnowledgeRedirectPageProps) {
  const params = await searchParams;
  const query = params.section ? `?section=${encodeURIComponent(params.section)}` : "";
  redirect(`/company${query}`);
}
