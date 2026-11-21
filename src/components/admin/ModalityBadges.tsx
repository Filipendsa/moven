"use client";

import { BookOpen, Compass } from "lucide-react";

interface ModalityBadgesProps {
  modality: "SCHOOL" | "MISSION" | "BOTH";
  missionTitle?: string | null;
}

export default function ModalityBadges({
  modality,
  missionTitle,
}: ModalityBadgesProps) {
  const resolvedMission = missionTitle || "Missão Amazonas 2027";
  const showSchool = modality === "SCHOOL" || modality === "BOTH";
  const showMission = modality === "MISSION" || modality === "BOTH";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showSchool && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#8fa66a]/20 text-[var(--ink)] border border-[#8fa66a]/30 whitespace-nowrap">
          <BookOpen className="w-3 h-3 text-[#8fa66a]" />
          Escola
        </span>
      )}
      {showMission && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/25 whitespace-nowrap">
          <Compass className="w-3 h-3" />
          {resolvedMission}
        </span>
      )}
    </div>
  );
}
