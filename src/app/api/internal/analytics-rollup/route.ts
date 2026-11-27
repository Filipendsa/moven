import { NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/shared/config/env";
import { supabaseServer } from "@/shared/infrastructure/supabase/server";
import { verifyObservatoryHmac } from "@/shared/infrastructure/observatory/observatoryServer";

export async function GET(request: NextRequest) {
  if (!verifyObservatoryHmac(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!publicEnv.isSupabaseConfigured) {
    return NextResponse.json({ days: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const { data, error } = await supabaseServer
      .from("site_analytics")
      .select("event_type, source, created_at")
      .gte("created_at", cutoff)
      .limit(5000);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to read site_analytics" },
        { status: 500 }
      );
    }

    const byDay = new Map<
      string,
      {
        date: string;
        uniqueVisits: number;
        interestedCount: number;
        sources: Map<string, number>;
      }
    >();

    for (const row of data) {
      const date = String(row.created_at || "").slice(0, 10);
      if (!date) continue;
      let entry = byDay.get(date);
      if (!entry) {
        entry = { date, uniqueVisits: 0, interestedCount: 0, sources: new Map() };
        byDay.set(date, entry);
      }
      if (row.event_type === "VISIT") {
        entry.uniqueVisits += 1;
        const src = String(row.source || "web");
        entry.sources.set(src, (entry.sources.get(src) || 0) + 1);
      } else if (row.event_type === "INTEREST") {
        entry.interestedCount += 1;
      }
    }

    const days = Array.from(byDay.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: d.date,
        firstTimeUniqueVisits: d.uniqueVisits,
        interestedCount: d.interestedCount,
        pageviewsAvailable: false,
        deviceBreakdownAvailable: false,
        topSources: Array.from(d.sources.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }));

    return NextResponse.json({ days }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analytics sync failed" },
      { status: 500 }
    );
  }
}
