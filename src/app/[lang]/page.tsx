import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShieldCheck, Compass, Users } from "lucide-react";
import MissionsShowcase from "@/components/missions/MissionsShowcase";
import Navbar from "@/components/common/Navbar";
import { isValidLocale, Locale, formatBrl } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { publicEnv } from "@/shared/config/env";

function formatWhatsappDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (clean.length === 13 && clean.startsWith("55")) {
    return `+55 ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  return `+${clean}`;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "pt";
  const dict = getDictionary(locale);

  const communityWhatsapp = publicEnv.communityWhatsapp;
  const communityContactName = publicEnv.communityContactName;
  const whatsappCommunityUrl = `https://wa.me/${communityWhatsapp}?text=${encodeURIComponent(
    dict.community.whatsappMessage
  )}`;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Navigation with Blur */}
      <Navbar />

      {/* Hero Section */}
      <header className="bg-[#072119] text-[#e9e1d0] pt-12 pb-16 text-center border-b border-[#8fa66a]/20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="relative w-full max-w-[500px] h-48 mx-auto mb-4">
            <Image
              src="/images/moven-logo.jpg"
              alt="MOVEN · UNASP-HT"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight max-w-2xl mx-auto mb-4 leading-tight">
            {dict.hero.tagline}
          </h1>

          <p className="text-base sm:text-lg text-[#d5cfbf] max-w-xl mx-auto mb-8">
            {dict.hero.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link
              href={`/${locale}/enrollment?modality=SCHOOL`}
              className="inline-block bg-[#8fa66a] text-[#072119] font-heading font-semibold px-7 py-3.5 rounded-full border-2 border-[#8fa66a] hover:bg-[#e9e1d0] hover:border-[#e9e1d0] transition-colors shadow-lg"
            >
              {dict.hero.ctaPrimary}
            </Link>
            <Link
              href={`/${locale}/enrollment?modality=MISSION`}
              className="inline-block text-[#e9e1d0] font-heading font-semibold px-7 py-3.5 rounded-full border-2 border-[#8fa66a] hover:bg-[#8fa66a] hover:text-[#072119] transition-colors"
            >
              {dict.hero.ctaSecondary}
            </Link>
            <a
              href={whatsappCommunityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#8fa66a] font-heading font-semibold px-6 py-3.5 rounded-full border-2 border-[#8fa66a]/40 hover:border-[#8fa66a] hover:bg-[#8fa66a]/10 transition-colors"
            >
              <Users className="w-5 h-5" />
              {dict.hero.ctaCommunity}
            </a>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#e9e1d0]/20 rounded-2xl overflow-hidden border border-[#e9e1d0]/20 text-left">
            {dict.hero.stats.map((stat, idx) => (
              <div key={idx} className="bg-[#072119] p-4 sm:p-5">
                <b className="block text-xl sm:text-2xl font-heading text-[#8fa66a]">
                  {stat.value}
                </b>
                <span className="text-xs sm:text-sm text-[#cfc9b8]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Section 1: About */}
      <section id="about" className="py-16">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-[var(--ink)]">
              {dict.about.title}
            </h2>
            <p className="mb-4">{dict.about.p1}</p>
            <p className="mb-4">{dict.about.p2}</p>
            <p className="mb-4">{dict.about.p3}</p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--ink)]">
              {dict.about.goals.map((goal, idx) => (
                <li key={idx}>{goal}</li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-5 bg-[var(--card)] p-6 rounded-2xl border border-[var(--terra)]/20">
            <h3 className="text-xl font-semibold mb-4 text-[var(--ink)] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[var(--terra)]" />
              {dict.about.biblicalTitle}
            </h3>
            {dict.about.verses.map((verse, idx) => (
              <div
                key={idx}
                className={`border-l-4 border-[var(--terra)] pl-4 ${
                  idx < dict.about.verses.length - 1 ? "mb-4" : ""
                }`}
              >
                <b className="block font-heading text-[var(--ink)]">
                  {verse.ref}
                </b>
                <span className="text-sm text-[var(--mut)]">{verse.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: School */}
      <section id="school" className="py-16 bg-[var(--card)]">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-3 text-[var(--ink)]">
            {dict.school.title}
          </h2>
          <p className="max-w-2xl mb-8 text-[var(--ink)]/90">
            {dict.school.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--ink)]">
                {dict.school.howItWorksTitle}
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-[var(--ink)]">
                {dict.school.howItWorks.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--ink)]">
                {dict.school.studyTitle}
              </h3>
              <div className="flex flex-wrap gap-2">
                {dict.school.topics.map((item, idx) => (
                  <span
                    key={idx}
                    className="border border-[#8fa66a] text-[var(--ink)] rounded-full px-3.5 py-1 text-xs sm:text-sm bg-[#8fa66a]/10"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-[var(--ink)]">
            {dict.school.certTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {dict.school.certItems.map((cert, idx) => (
              <div
                key={idx}
                className="border-t-4 border-[var(--terra)] pt-3 bg-white/40 dark:bg-black/20 p-4 rounded-b-xl"
              >
                <b className="block text-3xl font-heading text-[var(--ink)]">
                  {cert.value}
                </b>
                <span className="text-sm text-[var(--mut)]">{cert.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Dates */}
      <section id="dates" className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-[var(--ink)]">
            {dict.dates.title}
          </h2>
          <p className="text-[var(--mut)] mb-8">{dict.dates.subtitle}</p>

          <ol className="relative border-l-2 border-[#8fa66a] ml-3 sm:ml-4 space-y-6">
            {dict.dates.items.map((item, idx) => (
              <li key={idx} className="relative pl-6 sm:pl-8">
                <span
                  className={`absolute -left-[7px] top-1.5 rounded-full ${
                    item.highlight
                      ? "w-4 h-4 bg-[#8fa66a] -left-[9px] border-2 border-[var(--bg)]"
                      : "w-3 h-3 bg-[var(--bg)] border-2 border-[#8fa66a]"
                  }`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <span className="sm:col-span-3 font-heading font-semibold text-[var(--terra)] text-sm sm:text-base">
                    {item.date}
                  </span>
                  <div className="sm:col-span-9">
                    <span
                      className={`block text-[var(--ink)] ${
                        item.highlight ? "font-bold text-lg" : "font-medium"
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.desc && (
                      <small className="block text-[var(--mut)] text-xs sm:text-sm">
                        {item.desc}
                      </small>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Section 4: Pricing */}
      <section id="pricing" className="py-16 bg-[#072119] text-[#e9e1d0]">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-2">
            {dict.pricing.title}
          </h2>
          <p className="text-[#d5cfbf] mb-8">{dict.pricing.subtitle}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* School Card */}
            <div className="bg-[#12302a] border border-[#8fa66a]/30 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8fa66a] font-semibold">
                  {dict.pricing.school.badge}
                </span>
                <h3 className="text-2xl font-bold mt-1 mb-2">
                  {dict.pricing.school.title}
                </h3>
                <div className="text-4xl font-heading font-bold text-[#e9e1d0] my-3">
                  {formatBrl(17000, locale)}{" "}
                  <small className="text-sm font-normal text-[#cfc9b8]">
                    {dict.pricing.school.unit}
                  </small>
                </div>
                <p className="text-sm text-[#cfc9b8] mb-4">
                  {dict.pricing.school.note}
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[#d5cfbf] mb-6">
                  {dict.pricing.school.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>
              <Link
                href={`/${locale}/enrollment?modality=SCHOOL`}
                className="w-full text-center bg-[#8fa66a] text-[#072119] font-heading font-semibold py-3.5 rounded-full hover:bg-[#e9e1d0] transition-colors"
              >
                {dict.pricing.school.cta}
              </Link>
            </div>

            {/* Mission Card */}
            <div className="bg-[#12302a] border border-[#8fa66a]/30 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#8fa66a] font-semibold">
                  {dict.pricing.mission.badge}
                </span>
                <h3 className="text-2xl font-bold mt-1 mb-2">
                  {dict.pricing.mission.title}
                </h3>
                <div className="text-4xl font-heading font-bold text-[#e9e1d0] my-3">
                  {formatBrl(250000, locale)}{" "}
                  <small className="text-sm font-normal text-[#cfc9b8]">
                    {dict.pricing.mission.unit}
                  </small>
                </div>
                <p className="text-sm text-[#cfc9b8] mb-4">
                  {dict.pricing.mission.note}
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[#d5cfbf] mb-6">
                  {dict.pricing.mission.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>
              <Link
                href={`/${locale}/enrollment?modality=MISSION`}
                className="w-full text-center bg-[#8fa66a] text-[#072119] font-heading font-semibold py-3.5 rounded-full hover:bg-[#e9e1d0] transition-colors"
              >
                {dict.pricing.mission.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Mission Details & Dynamic Missions Showcase */}
      <section id="amazon" className="py-16">
        <div className="max-w-5xl mx-auto px-5 space-y-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-[var(--ink)]">
              {dict.amazon.title}
            </h2>
            <p className="text-[var(--mut)] mb-8">{dict.amazon.subtitle}</p>
            <MissionsShowcase />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-4">
            <div className="md:col-span-7">
              <h3 className="text-2xl font-semibold mb-4 text-[var(--ink)]">
                {dict.amazon.howTitle}
              </h3>
              <p className="mb-4">{dict.amazon.p1}</p>
              <p>{dict.amazon.p2}</p>
            </div>
            <div className="md:col-span-5 bg-[var(--card)] p-6 rounded-2xl border border-[var(--terra)]/20">
              <h3 className="text-xl font-semibold mb-4 text-[var(--ink)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--terra)]" />
                {dict.amazon.beforeTitle}
              </h3>
              <ul className="list-disc pl-5 space-y-3 text-sm text-[var(--ink)]">
                {dict.amazon.beforeItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Enrollment CTA */}
      <section id="enrollment" className="py-16 bg-[#072119] text-center text-[#e9e1d0]">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-3">
            {dict.cta.title}
          </h2>
          <p className="text-[#d5cfbf] mb-8">{dict.cta.subtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/enrollment?modality=SCHOOL`}
              className="bg-[#8fa66a] text-[#072119] font-heading font-semibold px-8 py-3.5 rounded-full hover:bg-[#e9e1d0] transition-colors shadow-lg"
            >
              {dict.cta.school}
            </Link>
            <Link
              href={`/${locale}/enrollment?modality=MISSION`}
              className="text-[#e9e1d0] font-heading font-semibold px-8 py-3.5 rounded-full border-2 border-[#8fa66a] hover:bg-[#8fa66a] hover:text-[#072119] transition-colors"
            >
              {dict.cta.mission}
            </Link>
            <Link
              href={`/${locale}/enrollment?modality=BOTH`}
              className="bg-[var(--terra)] text-[#e9e1d0] font-heading font-semibold px-8 py-3.5 rounded-full hover:bg-[var(--terra)]/80 transition-colors shadow-lg"
            >
              {dict.cta.both}
            </Link>
          </div>
        </div>
      </section>

      {/* WhatsApp / Community Section */}
      <section className="py-16 bg-[#8fa66a] text-[#072119] text-center">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-3">
            {dict.community.title}
          </h2>
          <p className="text-[#072119]/90 mb-8 max-w-xl mx-auto">
            {dict.community.subtitlePrefix} {communityContactName}{" "}
            {dict.community.subtitleSuffix}
          </p>
          <a
            href={whatsappCommunityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-semibold px-8 py-4 rounded-full hover:bg-[var(--terra)] transition-colors shadow-lg text-lg"
          >
            <MessageCircle className="w-6 h-6 text-[#8fa66a]" />
            {formatWhatsappDisplay(communityWhatsapp)}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#072119] text-[#cfc9b8] py-8 border-t border-[#8fa66a]/20 text-center text-sm">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="font-semibold text-[#e9e1d0]">
              {dict.footer.brand}
            </div>
            <div className="text-xs text-[#cfc9b8]/80">
              {dict.footer.tagline}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              href={`/${locale}/privacy`}
              className="hover:text-[#8fa66a] transition-colors"
            >
              {dict.footer.privacy}
            </Link>
            <span>•</span>
            <Link
              href={`/${locale}/terms`}
              className="hover:text-[#8fa66a] transition-colors"
            >
              {dict.footer.terms}
            </Link>
            <span>•</span>
            <Link
              href="/admin/login"
              className="hover:text-[#8fa66a] transition-colors opacity-70 hover:opacity-100"
            >
              {dict.footer.admin}
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-5 mt-6 pt-4 border-t border-white/10 text-xs text-[#cfc9b8]/70">
          {dict.footer.poweredBy}{" "}
          <a
            href={publicEnv.poweredByUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8fa66a] font-semibold hover:underline"
          >
            Yesode
          </a>
        </div>
      </footer>
    </div>
  );
}
