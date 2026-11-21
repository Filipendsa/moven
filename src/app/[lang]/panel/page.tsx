import { redirect } from "next/navigation";

export default async function LegacyPanelRedirectPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/missionary`);
}
