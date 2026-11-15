import { publicEnv, AppLocale } from "@/shared/config/env";

export const locales = ["pt", "es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = publicEnv.defaultLocale;
export const LOCALE_COOKIE_NAME = "moven_locale";

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const INTL_LOCALE_MAP: Record<Locale, string> = {
  pt: "pt-BR",
  es: "es-419",
  en: "en-US",
};

export function formatBrl(amountCents: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE_MAP[locale], {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}
