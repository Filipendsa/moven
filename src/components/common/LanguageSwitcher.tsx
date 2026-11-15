"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { locales, Locale, LOCALE_COOKIE_NAME } from "@/i18n/config";
import { useDictionary } from "@/i18n/DictionaryContext";

const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  pt: { short: "PT", name: "Português" },
  es: { short: "ES", name: "Español" },
  en: { short: "EN", name: "English" },
};

export default function LanguageSwitcher() {
  const { locale } = useDictionary();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSwitch = (targetLocale: Locale) => {
    if (targetLocale === locale) return;

    document.cookie = `${LOCALE_COOKIE_NAME}=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;

    const segments = pathname.split("/");
    if (segments.length > 1 && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = targetLocale;
    } else {
      segments.splice(1, 0, targetLocale);
    }

    const nextPath = segments.join("/") || `/${targetLocale}`;
    const query = searchParams.toString();
    router.push(query ? `${nextPath}?${query}` : nextPath);
  };

  return (
    <div
      className="inline-flex items-center rounded-full bg-white/10 p-0.5 border border-[#8fa66a]/30"
      role="group"
      aria-label="Language selector"
    >
      {locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => handleSwitch(loc)}
            title={LOCALE_LABELS[loc].name}
            aria-pressed={active}
            className={`px-2.5 py-1 rounded-full text-[11px] font-heading font-bold transition-colors ${
              active
                ? "bg-[#8fa66a] text-[#072119]"
                : "text-[#e9e1d0]/80 hover:text-[#e9e1d0]"
            }`}
          >
            {LOCALE_LABELS[loc].short}
          </button>
        );
      })}
    </div>
  );
}
