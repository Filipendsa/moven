"use client";

import {
  ALLOWED_SHIRT_SIZES,
  ShirtSizeType,
} from "@/modules/enrollment/domain/value-objects/ShirtSize";

interface ShirtSizeSelectorProps {
  value: ShirtSizeType | "";
  onChange: (size: ShirtSizeType) => void;
  disabled?: boolean;
}

export default function ShirtSizeSelector({
  value,
  onChange,
  disabled = false,
}: ShirtSizeSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {ALLOWED_SHIRT_SIZES.map((size) => {
        const isSelected = value === size;
        return (
          <button
            key={size}
            type="button"
            disabled={disabled}
            onClick={() => onChange(size)}
            aria-pressed={isSelected}
            className={`py-2.5 px-3 rounded-xl border-2 font-heading font-bold text-sm transition-all ${
              isSelected
                ? "border-[#8fa66a] bg-[#8fa66a] text-[#072119] shadow-sm"
                : "border-black/15 dark:border-white/15 bg-white/70 dark:bg-black/30 text-[var(--ink)] hover:border-[#8fa66a]/60"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
