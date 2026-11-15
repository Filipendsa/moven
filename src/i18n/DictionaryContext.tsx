"use client";

import React, { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./getDictionary";

interface DictionaryContextValue {
  locale: Locale;
  dict: Dictionary;
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

export function DictionaryProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={{ locale, dict }}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary(): DictionaryContextValue {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error("useDictionary must be used inside a DictionaryProvider");
  }
  return ctx;
}
