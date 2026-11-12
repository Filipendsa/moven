"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Anchor, Calendar, MapPin, Sparkles, Clock, ArrowRight } from "lucide-react";

export interface PublicMissionDto {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  priceCents: number;
  priceFormatted: string;
  minSlots: number;
  maxSlots: number | null;
  paidCount: number;
  waitlistCount: number;
  pendingCount: number;
  isWaitlistMode: boolean;
  canEnroll: boolean;
  isFeatured: boolean;
  status: string;
}

export default function MissionsShowcase() {
  const [missions, setMissions] = useState<PublicMissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/missions")
      .then((res) => res.json())
      .then((data) => {
        setMissions(data.missions || []);
      })
      .catch((err) => console.error("Erro ao carregar missões:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--mut)]">
        Carregando missões disponíveis...
      </div>
    );
  }

  if (missions.length === 0) {
    return null;
  }

  const featured = missions.find((m) => m.isFeatured) || missions[0];
  const others = missions.filter((m) => m.id !== featured.id);

  return (
    <div className="space-y-10">
      {/* Featured Mission */}
      <div className="bg-[var(--card)] border-2 border-[#8fa66a]/40 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-[#8fa66a] text-[#072119] px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Missão em Destaque
          </span>
          {featured.isWaitlistMode ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              Vagas iniciais preenchidas · Lista de Espera Aberta
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full">
              Inscrições Abertas ({featured.paidCount} / {featured.minSlots} vagas mínimas confirmadas)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8">
            <h3 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--ink)] mb-1">
              {featured.title}
            </h3>
            {featured.subtitle && (
              <p className="text-sm font-semibold text-[var(--terra)] mb-3">
                {featured.subtitle}
              </p>
            )}
            <p className="text-sm sm:text-base text-[var(--ink)]/90 mb-5 leading-relaxed">
              {featured.description}
            </p>

            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-[var(--mut)]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#8fa66a]" />
                {featured.startDate} a {featured.endDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#8fa66a]" />
                {featured.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-[#8fa66a]" />
                Mínimo {featured.minSlots} vagas (+ lista de espera para novas vagas)
              </span>
            </div>
          </div>

          <div className="md:col-span-4 bg-[#072119] text-[#e9e1d0] p-6 rounded-2xl text-center flex flex-col justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#8fa66a] font-semibold">
                Investimento
              </span>
              <div className="text-3xl font-heading font-bold mt-1">
                {featured.priceFormatted}
              </div>
              <span className="text-xs text-[#cfc9b8]">
                {featured.isWaitlistMode
                  ? "Cadastre-se na lista de espera gratuitamente"
                  : "Parcele em até 7x"}
              </span>
            </div>

            <Link
              href={`/enrollment?modality=MISSION&mission=${featured.id}`}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#8fa66a] text-[#072119] font-heading font-bold py-3 px-5 rounded-full hover:bg-[#e9e1d0] transition-colors text-sm"
            >
              <span>
                {featured.isWaitlistMode
                  ? "Entrar na Lista de Espera"
                  : "Inscrever nesta Missão"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Other Active / Upcoming Missions */}
      {others.length > 0 && (
        <div>
          <h3 className="text-xl font-bold font-heading text-[var(--ink)] mb-4">
            Outras Missões e Expedições
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {others.map((m) => (
              <div
                key={m.id}
                className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[var(--terra)] uppercase tracking-wider">
                      {m.startDate} – {m.endDate}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#8fa66a]/20 text-[var(--ink)]">
                      {m.isWaitlistMode ? "Lista de Espera" : "Vagas Abertas"}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold font-heading text-[var(--ink)] mb-1">
                    {m.title}
                  </h4>
                  <p className="text-xs text-[var(--mut)] mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8fa66a]" />
                    {m.location}
                  </p>
                  <p className="text-sm text-[var(--ink)]/85 line-clamp-3">
                    {m.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-black/10 dark:border-white/10">
                  <span className="font-heading font-bold text-lg text-[var(--ink)]">
                    {m.priceFormatted}
                  </span>
                  <Link
                    href={`/enrollment?modality=MISSION&mission=${m.id}`}
                    className="inline-flex items-center gap-1.5 bg-[#072119] text-[#e9e1d0] font-heading font-semibold text-xs px-4 py-2 rounded-full hover:bg-[var(--terra)] transition-colors"
                  >
                    {m.isWaitlistMode ? "Lista de Espera" : "Inscrever-se"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
