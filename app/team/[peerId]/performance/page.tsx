import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ peerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPeerPerformanceRedirectPage({
  params,
  searchParams,
}: Props) {
  const { peerId } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.set(key, value);
    }
  }
  const query = qs.toString();
  redirect(query ? `/team/${peerId}/results?${query}` : `/team/${peerId}/results`);
}
