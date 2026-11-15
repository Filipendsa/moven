import type { Locale } from "./config";
import pt from "./dictionaries/pt.json";
import es from "./dictionaries/es.json";
import en from "./dictionaries/en.json";

export type Dictionary = typeof pt;

const dictionaries: Record<Locale, Dictionary> = {
  pt,
  es,
  en,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.pt;
}
