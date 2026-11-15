import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isValidLocale, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { DictionaryProvider } from "@/i18n/DictionaryContext";
import CookieConsentBanner from "@/components/common/CookieConsentBanner";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "pt";
  const dict = getDictionary(locale);

  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isValidLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);

  return (
    <DictionaryProvider locale={lang} dict={dict}>
      {children}
      <CookieConsentBanner />
    </DictionaryProvider>
  );
}
