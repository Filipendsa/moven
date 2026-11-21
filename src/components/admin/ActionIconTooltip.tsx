"use client";

import React from "react";

interface ActionIconTooltipProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "emerald" | "amber" | "purple" | "neutral";
}

const VARIANT_CLASSES: Record<
  NonNullable<ActionIconTooltipProps["variant"]>,
  string
> = {
  emerald:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30",
  amber:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30",
  purple:
    "bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 border border-purple-500/30",
  neutral:
    "bg-black/5 dark:bg-white/10 text-[var(--ink)] hover:bg-black/15 dark:hover:bg-white/20 border border-black/10 dark:border-white/10",
};

export default function ActionIconTooltip({
  label,
  icon,
  onClick,
  href,
  variant = "neutral",
}: ActionIconTooltipProps) {
  const triggerClass = `w-9 h-9 rounded-xl inline-flex items-center justify-center transition-colors ${VARIANT_CLASSES[variant]}`;

  return (
    <div className="relative group inline-flex">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={triggerClass}
        >
          {icon}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={triggerClass}
        >
          {icon}
        </button>
      )}

      <span
        role="tooltip"
        className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-[#072119] text-[#e9e1d0] border border-[#8fa66a]/40 text-[11px] font-medium whitespace-nowrap shadow-xl z-40"
      >
        {label}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#072119]" />
      </span>
    </div>
  );
}
