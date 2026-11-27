"use client";

const COLLECT_URL =
  process.env.NEXT_PUBLIC_OBSERVATORY_COLLECT_URL ||
  "https://yesode.com/api/observatory/collect";
const ENABLED = process.env.NEXT_PUBLIC_OBSERVATORY_ENABLED !== "false";

export function sendMovenObservatoryBeacon(
  kind: "pageview" | "browser_error" | "ux_diagnostic",
  route: string,
  error?: {
    name?: string;
    message: string;
    stack?: string | null;
    severity?: "info" | "warning" | "error";
    meta?: Record<string, string | number | boolean | null>;
  }
): void {
  if (!ENABLED || typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      service: "moven",
      kind,
      route,
      referrer: document.referrer || null,
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
      release: process.env.NEXT_PUBLIC_APP_VERSION || null,
      ...(error ? { error } : {}),
    });

    if (body.length > 7800) return;

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(COLLECT_URL, blob)) return;
    }

    fetch(COLLECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  } catch {
    // Silent fail-safe
  }
}
