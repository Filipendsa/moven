"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#about", label: "Sobre" },
  { href: "#school", label: "Escola" },
  { href: "#dates", label: "Datas" },
  { href: "#pricing", label: "Valores" },
  { href: "#amazon", label: "Missão Amazonas" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 bg-[#072119]/95 backdrop-blur-md border-b border-[#8fa66a]/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 min-h-[58px] flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-[#e9e1d0] font-heading font-bold text-lg tracking-wider flex items-center gap-2 flex-shrink-0"
        >
          <span className="text-[#8fa66a]">MOVEN</span>
          <span className="text-xs text-[#8fa66a]/80 font-normal hidden sm:inline">
            · Núcleo de Missões
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-5 text-sm font-heading font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#e9e1d0]/85 hover:text-[#8fa66a] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/enrollment"
            className="bg-[#8fa66a] text-[#072119] px-4 py-1.5 rounded-full font-semibold hover:bg-[#e9e1d0] transition-colors text-xs uppercase tracking-wide"
          >
            Inscrição
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/enrollment"
            className="bg-[#8fa66a] text-[#072119] px-3.5 py-2 rounded-full font-semibold hover:bg-[#e9e1d0] transition-colors text-xs uppercase tracking-wide whitespace-nowrap"
          >
            Inscrição
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-xl text-sm font-heading font-medium text-[#e9e1d0]/90 hover:bg-white/10 hover:text-[#8fa66a] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

