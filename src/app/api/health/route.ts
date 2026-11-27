import { NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/shared/config/env";
import { APP_COMMIT, APP_VERSION } from "@/shared/config/version";
import { supabaseServer } from "@/shared/infrastructure/supabase/server";
import { verifyObservatoryHmac } from "@/shared/infrastructure/observatory/observatoryServer";

export async function GET(request: NextRequest) {
  const hasSignature = request.headers.has("x-observatory-signature");

  if (!hasSignature) {
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!verifyObservatoryHmac(request.headers)) {
    return NextResponse.json(
      { status: "error", error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs = 0;
  let dbError: string | undefined;

  if (!publicEnv.isSupabaseConfigured) {
    dbError = "Supabase não configurado no ambiente Moven.";
  } else {
    const start = Date.now();
    try {
      const { error } = await supabaseServer
        .from("missions")
        .select("id", { count: "exact", head: true });
      dbLatencyMs = Date.now() - start;

      if (error) {
        dbStatus = "error";
        dbError = error.message;
      } else {
        dbStatus = "ok";
      }
    } catch (err: unknown) {
      dbLatencyMs = Date.now() - start;
      dbStatus = "error";
      dbError = err instanceof Error ? err.message : "Falha na consulta ao Supabase.";
    }
  }

  return NextResponse.json(
    {
      status: dbStatus === "ok" ? "online" : "degraded",
      service: "moven",
      db: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      storage: { status: "not_applicable" },
      operatingMode: publicEnv.paymentMode,
      releaseVersion: APP_COMMIT || APP_VERSION,
    },
    {
      status: dbStatus === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
