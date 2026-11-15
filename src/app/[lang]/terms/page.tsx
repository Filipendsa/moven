import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { isValidLocale, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "pt";
  const dict = getDictionary(locale);
  const t = dict.terms;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-5">
      <div className="max-w-3xl mx-auto bg-[var(--card)] p-8 sm:p-12 rounded-3xl border border-[var(--terra)]/20 shadow-xl">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> {t.backHome}
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-[#8fa66a] flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            {t.title}
          </h1>
        </div>

        <p className="text-xs text-[var(--mut)] mb-4">{t.subtitle}</p>

        {t.legalNotice && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
            {t.legalNotice}
          </div>
        )}

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-[var(--ink)]">
          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              {t.s1Title}
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              {t.s1Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              {t.s2Title}
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              {t.s2Items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold font-heading text-[var(--terra)] mb-2">
              {t.s3Title}
            </h2>
            <p>{t.s3Body}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
