"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import InstagramIcon from "./InstagramIcon";
import { useDictionary } from "@/i18n/DictionaryContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { publicEnv } from "@/shared/config/env";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, dict } = useDictionary();

  const navLinks = [
    { href: `/${locale}#about`, label: dict.nav.about },
    { href: `/${locale}#school`, label: dict.nav.school },
    { href: `/${locale}#dates`, label: dict.nav.dates },
    { href: `/${locale}#pricing`, label: dict.nav.pricing },
    { href: `/${locale}#amazon`, label: dict.nav.amazon },
    { href: `/${locale}/panel`, label: dict.nav.panel },
  ];

  return (
    <nav className="sticky top-0 z-30 bg-[#072119]/95 backdrop-blur-md border-b border-[#8fa66a]/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 min-h-[58px] flex items-center justify-between gap-3">
        <Link
          href={`/${locale}`}
          className="text-[#e9e1d0] font-heading font-bold text-lg tracking-wider flex items-center gap-2 flex-shrink-0"
        >
          <span className="text-[#8fa66a]">MOVEN</span>
          <span className="text-xs text-[#8fa66a]/80 font-normal hidden sm:inline">
            {dict.nav.subtitle}
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4 text-sm font-heading font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={publicEnv.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram MOVEN"
            title="@moven.nucleodemissoes"
            className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors p-1.5"
          >
            <InstagramIcon className="w-4 h-4" />
          </a>
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <Link
            href={`/${locale}/enrollment`}
            className="bg-[#8fa66a] text-[#072119] px-4 py-1.5 rounded-full font-semibold hover:bg-[#e9e1d0] transition-colors text-xs uppercase tracking-wide whitespace-nowrap"
          >
            {dict.nav.enroll}
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href={`/${locale}/enrollment`}
            className="bg-[#8fa66a] text-[#072119] px-3.5 py-2 rounded-full font-semibold hover:bg-[#e9e1d0] transition-colors text-xs uppercase tracking-wide whitespace-nowrap"
          >
            {dict.nav.enroll}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            aria-expanded={menuOpen}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#e9e1d0] hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#8fa66a]/20 bg-[#072119] px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-xl text-sm font-heading font-medium text-[#e9e1d0]/90 hover:bg-white/10 hover:text-[#8fa66a] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 mt-1 border-t border-[#8fa66a]/20 flex items-center justify-between px-3 py-1">
            <a
              href={publicEnv.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-[#e9e1d0]/85 hover:text-[#8fa66a] font-heading"
            >
              <InstagramIcon className="w-4 h-4 text-[#8fa66a]" />
              @moven.nucleodemissoes
            </a>
            <Suspense fallback={null}>
              <LanguageSwitcher />
            </Suspense>
          </div>
        </div>
      )}
    </nav>
  );
}
