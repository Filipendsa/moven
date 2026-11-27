"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendMovenObservatoryBeacon } from "@/shared/infrastructure/observatory/observatoryClient";

let listenersAttached = false;

export default function ObservatoryBridge() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    const route = `${pathname || "/"}${window.location.search || ""}`;
    sendMovenObservatoryBeacon("pageview", route);
  }, [pathname]);

  useEffect(() => {
    if (listenersAttached) return;
    listenersAttached = true;

    const onError = (event: ErrorEvent) => {
      sendMovenObservatoryBeacon("browser_error", window.location.pathname || "/", {
        name: event.error?.name || "WindowError",
        message: event.message || "Unhandled window error",
        stack: event.error?.stack || null,
        severity: "error",
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { name?: string; message?: string; stack?: string } | undefined;
      sendMovenObservatoryBeacon("browser_error", window.location.pathname || "/", {
        name: reason?.name || "UnhandledRejection",
        message: reason?.message || String(reason || "Unhandled rejection"),
        stack: reason?.stack || null,
        severity: "error",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      listenersAttached = false;
    };
  }, []);

  return null;
}
