"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Eye, Heart, Check } from "lucide-react";
import { useDictionary } from "@/i18n/DictionaryContext";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  const key = "moven_visitor_id";
  let id = localStorage.getItem(key);
  if (!id || id.length < 8) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `mv_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export default function VisitorTracker({
  showBadge = false,
  source = "home",
  autoInterestSource,
}: {
  showBadge?: boolean;
  source?: string;
  autoInterestSource?: string;
}) {
  const { locale, dict } = useDictionary();
  const t = dict.analytics;

  const [uniqueVisits, setUniqueVisits] = useState<number | null>(null);
  const [interestedCount, setInterestedCount] = useState<number | null>(null);
  const [interestSent, setInterestSent] = useState(false);

  const interactedRef = useRef(false);
  const mountTimeRef = useRef<number>(0);

  const sendEvent = useCallback(
    async (eventType: "VISIT" | "INTEREST", eventSource: string) => {
      if (typeof window === "undefined") return;
      if (navigator.webdriver) return;
      if (document.visibilityState !== "visible") return;

      const visitorId = getOrCreateVisitorId();
      const dwellMs = mountTimeRef.current > 0 ? Date.now() - mountTimeRef.current : 0;

      try {
        const res = await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            visitorId,
            source: eventSource,
            locale,
            humanProof: {
              webdriver: Boolean(navigator.webdriver),
              interacted: interactedRef.current,
              dwellMs,
            },
          }),
        });

        const data = await res.json();
        if (data?.ok) {
          setUniqueVisits(data.uniqueVisits);
          setInterestedCount(data.interestedCount);
          if (eventType === "INTEREST") {
            sessionStorage.setItem("moven_interest_sent", "1");
            setInterestSent(true);
          } else {
            sessionStorage.setItem("moven_visit_sent", "1");
          }
        }
      } catch {
        // Silent fail to avoid impacting UX
      }
    },
    [locale]
  );

  useEffect(() => {
    mountTimeRef.current = Date.now();

    if (sessionStorage.getItem("moven_interest_sent") === "1") {
      setInterestSent(true);
    }

    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.uniqueVisits === "number") {
          setUniqueVisits(data.uniqueVisits);
        }
        if (typeof data?.interestedCount === "number") {
          setInterestedCount(data.interestedCount);
        }
      })
      .catch(() => {});

    let visitTimer: ReturnType<typeof setTimeout> | null = null;

    const tryRecordVisit = () => {
      if (
        interactedRef.current &&
        Date.now() - mountTimeRef.current >= 1500 &&
        sessionStorage.getItem("moven_visit_sent") !== "1"
      ) {
        sendEvent("VISIT", source);
      }

      if (
        autoInterestSource &&
        interactedRef.current &&
        sessionStorage.getItem("moven_interest_sent") !== "1"
      ) {
        sendEvent("INTEREST", autoInterestSource);
      }
    };

    const onHumanGesture = () => {
      interactedRef.current = true;
      tryRecordVisit();
    };

    const onDocumentClick = (e: MouseEvent) => {
      interactedRef.current = true;
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      if (
        href.includes("/enrollment") ||
        href.includes("chat.whatsapp.com")
      ) {
        sendEvent(
          "INTEREST",
          href.includes("chat.whatsapp.com") ? "whatsapp_group" : "enrollment_cta"
        );
      }
    };

    window.addEventListener("pointermove", onHumanGesture, { passive: true, once: true });
    window.addEventListener("scroll", onHumanGesture, { passive: true, once: true });
    window.addEventListener("touchstart", onHumanGesture, { passive: true, once: true });
    window.addEventListener("keydown", onHumanGesture, { passive: true, once: true });
    document.addEventListener("click", onDocumentClick);

    visitTimer = setTimeout(tryRecordVisit, 1600);

    return () => {
      if (visitTimer) clearTimeout(visitTimer);
      window.removeEventListener("pointermove", onHumanGesture);
      window.removeEventListener("scroll", onHumanGesture);
      window.removeEventListener("touchstart", onHumanGesture);
      window.removeEventListener("keydown", onHumanGesture);
      document.removeEventListener("click", onDocumentClick);
    };
  }, [source, autoInterestSource, sendEvent]);

  const handleManualInterest = () => {
    interactedRef.current = true;
    sendEvent("INTEREST", "interest_button");
  };

  if (!showBadge) {
    return null;
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white/5 border border-[#8fa66a]/30 rounded-2xl px-4 py-2.5 text-xs text-[#d5cfbf]">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 text-[#8fa66a]" />
        <strong className="text-[#e9e1d0]">
          {uniqueVisits !== null ? uniqueVisits.toLocaleString() : "—"}
        </strong>{" "}
        {t.visitsLabel}
      </span>

      <span className="text-[#8fa66a]/40">•</span>

      <span className="inline-flex items-center gap-1.5">
        <Heart className="w-3.5 h-3.5 text-[#8fa66a]" />
        <strong className="text-[#e9e1d0]">
          {interestedCount !== null ? interestedCount.toLocaleString() : "—"}
        </strong>{" "}
        {t.interestedLabel}
      </span>

      <button
        type="button"
        onClick={handleManualInterest}
        disabled={interestSent}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold transition-colors ${
          interestSent
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
            : "bg-[#8fa66a] text-[#072119] hover:bg-[#e9e1d0]"
        }`}
      >
        {interestSent ? (
          <>
            <Check className="w-3 h-3" />
            {t.interestConfirmed}
          </>
        ) : (
          <>
            <Heart className="w-3 h-3" />
            {t.interestButton}
          </>
        )}
      </button>
    </div>
  );
}
