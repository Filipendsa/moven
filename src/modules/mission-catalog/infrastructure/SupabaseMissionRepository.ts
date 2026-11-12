import { IMissionRepository } from "../domain/repositories/IMissionRepository";
import { Mission, MissionStatus } from "../domain/entities/Mission";
import { Money } from "../domain/value-objects/Money";
import { supabaseServer } from "@/shared/infrastructure/supabase/server";

interface MissionPersistenceRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  price_cents: number;
  min_slots: number;
  max_slots: number | null;
  waitlist_enabled: boolean;
  even3_checkout_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_AMAZON_MISSION_ID = "00000000-0000-4000-a000-000000002027";

export class SupabaseMissionRepository implements IMissionRepository {
  private static inMemoryStore = new Map<string, MissionPersistenceRow>([
    [
      DEFAULT_AMAZON_MISSION_ID,
      {
        id: DEFAULT_AMAZON_MISSION_ID,
        slug: "amazon-2027",
        title: "Missão Amazonas 2027",
        subtitle: "Projeto Salva-Vidas Amazônia · Missão Noroeste",
        description:
          "10 dias de barco pelos rios do Amazonas com ações de construção, evangelismo, saúde básica e apoio junto às comunidades ribeirinhas.",
        location: "Rios do Amazonas (Manaus e Comunidades Ribeirinhas)",
        start_date: "19/07/2027",
        end_date: "29/07/2027",
        price_cents: 246316,
        min_slots: 28,
        max_slots: 28,
        waitlist_enabled: true,
        even3_checkout_url:
          "https://ingressos.eventodaigreja.com.br/missao-salva-vidas-amazonia-julho-2027-034970c3",
        is_featured: true,
        is_active: true,
        status: "OPEN",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]);

  private hasSupabase(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );
  }

  private toRow(mission: Mission): MissionPersistenceRow {
    return {
      id: mission.id,
      slug: mission.slug,
      title: mission.title,
      subtitle: mission.subtitle || null,
      description: mission.description,
      location: mission.location,
      start_date: mission.startDate,
      end_date: mission.endDate,
      price_cents: mission.price.amountCents,
      min_slots: mission.minSlots,
      max_slots: mission.maxSlots,
      waitlist_enabled: mission.waitlistEnabled,
      even3_checkout_url: mission.even3CheckoutUrl || null,
      is_featured: mission.isFeatured,
      is_active: mission.isActive,
      status: mission.status,
      created_at: mission.createdAt.toISOString(),
      updated_at: mission.updatedAt.toISOString(),
    };
  }

  private toDomain(row: MissionPersistenceRow): Mission {
    const priceRes = Money.fromCents(row.price_cents);
    const price = priceRes.success ? priceRes.value : Money.zero();

    const missionRes = Mission.create(
      {
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle || undefined,
        description: row.description,
        location: row.location,
        startDate: row.start_date,
        endDate: row.end_date,
        price,
        minSlots: row.min_slots,
        maxSlots: row.max_slots,
        waitlistEnabled: row.waitlist_enabled,
        even3CheckoutUrl: row.even3_checkout_url || undefined,
        isFeatured: row.is_featured,
        isActive: row.is_active,
        status: row.status as MissionStatus,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );

    if (!missionRes.success) {
      throw missionRes.error;
    }

    return missionRes.value;
  }

  async save(mission: Mission): Promise<void> {
    const row = this.toRow(mission);
    SupabaseMissionRepository.inMemoryStore.set(row.id, row);

    if (this.hasSupabase()) {
      try {
        if (row.is_featured) {
          await supabaseServer
            .from("missions")
            .update({ is_featured: false })
            .neq("id", row.id);
        }
        const { error } = await supabaseServer.from("missions").upsert(row);
        if (error) {
          console.error("Supabase missions upsert error:", error);
        }
      } catch (err) {
        console.error("Supabase missions save error:", err);
      }
    }
  }

  async findById(id: string): Promise<Mission | null> {
    if (this.hasSupabase()) {
      try {
        const { data, error } = await supabaseServer
          .from("missions")
          .select("*")
          .eq("id", id)
          .single();
        if (data && !error) {
          return this.toDomain(data as MissionPersistenceRow);
        }
      } catch (err) {
        console.error("Supabase missions findById error:", err);
      }
    }

    const mem = SupabaseMissionRepository.inMemoryStore.get(id);
    return mem ? this.toDomain(mem) : null;
  }

  async findBySlug(slug: string): Promise<Mission | null> {
    if (this.hasSupabase()) {
      try {
        const { data, error } = await supabaseServer
          .from("missions")
          .select("*")
          .eq("slug", slug)
          .single();
        if (data && !error) {
          return this.toDomain(data as MissionPersistenceRow);
        }
      } catch (err) {
        console.error("Supabase missions findBySlug error:", err);
      }
    }

    const mem = Array.from(
      SupabaseMissionRepository.inMemoryStore.values()
    ).find((m) => m.slug === slug);
    return mem ? this.toDomain(mem) : null;
  }

  async findFeatured(): Promise<Mission | null> {
    const all = await this.listActive();
    return all.find((m) => m.isFeatured) || all[0] || null;
  }

  async listAll(): Promise<Mission[]> {
    let rows: MissionPersistenceRow[] = [];

    if (this.hasSupabase()) {
      try {
        const { data, error } = await supabaseServer
          .from("missions")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          rows = data as MissionPersistenceRow[];
        }
      } catch (err) {
        console.error("Supabase missions listAll error:", err);
      }
    }

    if (rows.length === 0) {
      rows = Array.from(SupabaseMissionRepository.inMemoryStore.values()).sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured)
      );
    }

    return rows.map((r) => this.toDomain(r));
  }

  async listActive(): Promise<Mission[]> {
    const all = await this.listAll();
    return all.filter((m) => m.isActive);
  }

  async setFeatured(id: string): Promise<void> {
    for (const [key, row] of SupabaseMissionRepository.inMemoryStore.entries()) {
      row.is_featured = key === id;
      row.updated_at = new Date().toISOString();
      SupabaseMissionRepository.inMemoryStore.set(key, row);
    }

    if (this.hasSupabase()) {
      try {
        await supabaseServer.from("missions").update({ is_featured: false }).neq("id", id);
        await supabaseServer
          .from("missions")
          .update({ is_featured: true, updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch (err) {
        console.error("Supabase setFeatured error:", err);
      }
    }
  }
}
