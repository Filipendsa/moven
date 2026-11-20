import { redirect } from "next/navigation";

export default async function LegacyPanelRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  const query = sp?.email ? `?email=${encodeURIComponent(sp.email)}` : "";
  redirect(`/${lang}/missionary${query}`);
}
