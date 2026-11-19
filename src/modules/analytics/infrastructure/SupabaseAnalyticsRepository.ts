import { supabaseServer } from "@/shared/infrastructure/supabase/server";
import { publicEnv } from "@/shared/config/env";

export type AnalyticsEventType = "VISIT" | "INTEREST";

export interface AnalyticsSummary {
  uniqueVisits: number;
  interestedCount: number;
}

export interface RecordAnalyticsInput {
  visitorHash: string;
  eventType: AnalyticsEventType;
  source?: string;
  locale?: string;
}

export class SupabaseAnalyticsRepository {
  private static visitHashes = new Set<string>();
  private static interestHashes = new Set<string>();

  async recordEvent(input: RecordAnalyticsInput): Promise<AnalyticsSummary> {
    if (input.eventType === "VISIT") {
      SupabaseAnalyticsRepository.visitHashes.add(input.visitorHash);
    } else {
      SupabaseAnalyticsRepository.interestHashes.add(input.visitorHash);
    }

    if (publicEnv.isSupabaseConfigured) {
      try {
        const { error } = await supabaseServer.from("site_analytics").upsert(
          {
            visitor_hash: input.visitorHash,
            event_type: input.eventType,
            source: input.source || "web",
            locale: input.locale || "pt",
          },
          {
            onConflict: "visitor_hash,event_type",
            ignoreDuplicates: true,
          }
        );

        if (error) {
          console.warn(
            "Supabase analytics fallback (using in-memory):",
            error.message
          );
        }
      } catch (err) {
        console.warn("Supabase analytics record error:", err);
      }
    }

    return this.getSummary();
  }

  async getSummary(): Promise<AnalyticsSummary> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const [visitsRes, interestRes] = await Promise.all([
          supabaseServer
            .from("site_analytics")
            .select("id", { count: "exact", head: true })
            .eq("event_type", "VISIT"),
          supabaseServer
            .from("site_analytics")
            .select("id", { count: "exact", head: true })
            .eq("event_type", "INTEREST"),
        ]);

        if (!visitsRes.error && !interestRes.error) {
          return {
            uniqueVisits: visitsRes.count ?? 0,
            interestedCount: interestRes.count ?? 0,
          };
        }
      } catch (err) {
        console.warn("Supabase analytics query error:", err);
      }
    }

    return {
      uniqueVisits: SupabaseAnalyticsRepository.visitHashes.size,
      interestedCount: SupabaseAnalyticsRepository.interestHashes.size,
    };
  }
}
