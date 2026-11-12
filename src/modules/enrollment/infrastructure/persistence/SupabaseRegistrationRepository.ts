import {
  IRegistrationRepository,
  EnrollmentFilters,
  EnrollmentMetrics,
} from "../../domain/repositories/IRegistrationRepository";
import { Registration, PaymentStatus } from "../../domain/entities/Registration";
import { RegistrationMapper, RegistrationPersistenceRow } from "./RegistrationMapper";
import { supabaseServer } from "@/shared/infrastructure/supabase/server";

export class SupabaseRegistrationRepository implements IRegistrationRepository {
  private static inMemoryStore = new Map<string, RegistrationPersistenceRow>();

  async save(registration: Registration): Promise<void> {
    const row = RegistrationMapper.toPersistence(registration);
    SupabaseRegistrationRepository.inMemoryStore.set(row.id, row);

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      try {
        const { error } = await supabaseServer
          .from("registrations")
          .upsert(row);

        if (error) {
          console.error("Supabase upsert error:", error);
        }
      } catch (err) {
        console.error("Failed to connect to Supabase, stored in memory:", err);
      }
    }
  }

  async findById(id: string): Promise<Registration | null> {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      try {
        const { data, error } = await supabaseServer
          .from("registrations")
          .select("*")
          .eq("id", id)
          .single();

        if (data && !error) {
          return RegistrationMapper.toDomain(data as RegistrationPersistenceRow);
        }
      } catch (err) {
        console.error("Supabase findById error:", err);
      }
    }

    const memoryRow = SupabaseRegistrationRepository.inMemoryStore.get(id);
    return memoryRow ? RegistrationMapper.toDomain(memoryRow) : null;
  }

  async findByCpf(cpf: string): Promise<Registration[]> {
    const cleanCpf = cpf.replace(/\D/g, "");
    const list = await this.list({ search: cleanCpf });
    return list.filter((r) => r.cpf.value === cleanCpf);
  }

  async list(filters?: EnrollmentFilters): Promise<Registration[]> {
    let rows: RegistrationPersistenceRow[] = [];

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      try {
        let query = supabaseServer
          .from("registrations")
          .select("*")
          .order("created_at", { ascending: false });

        if (filters?.status) {
          query = query.eq("payment_status", filters.status);
        }
        if (filters?.modality) {
          query = query.eq("modality", filters.modality);
        }
        if (filters?.missionId) {
          query = query.eq("mission_id", filters.missionId);
        }

        const { data, error } = await query;
        if (!error && data) {
          rows = data as RegistrationPersistenceRow[];
        }
      } catch (err) {
        console.error("Supabase list error:", err);
      }
    }

    if (rows.length === 0 && SupabaseRegistrationRepository.inMemoryStore.size > 0) {
      rows = Array.from(SupabaseRegistrationRepository.inMemoryStore.values());
      if (filters?.status) {
        rows = rows.filter((r) => r.payment_status === filters.status);
      }
      if (filters?.modality) {
        rows = rows.filter((r) => r.modality === filters.modality);
      }
      if (filters?.missionId) {
        rows = rows.filter((r) => r.mission_id === filters.missionId);
      }
      rows.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.cpf.includes(q) ||
          r.email.toLowerCase().includes(q)
      );
    }

    return rows.map((r) => RegistrationMapper.toDomain(r));
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    externalTxId?: string
  ): Promise<void> {
    const memoryRow = SupabaseRegistrationRepository.inMemoryStore.get(id);
    if (memoryRow) {
      memoryRow.payment_status = status;
      if (externalTxId) memoryRow.external_tx_id = externalTxId;
      memoryRow.updated_at = new Date().toISOString();
      SupabaseRegistrationRepository.inMemoryStore.set(id, memoryRow);
    }

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      try {
        const updateData: {
          payment_status: PaymentStatus;
          updated_at: string;
          external_tx_id?: string;
        } = {
          payment_status: status,
          updated_at: new Date().toISOString(),
        };
        if (externalTxId) updateData.external_tx_id = externalTxId;

        await supabaseServer
          .from("registrations")
          .update(updateData)
          .eq("id", id);
      } catch (err) {
        console.error("Supabase updateStatus error:", err);
      }
    }
  }

  async countByMission(
    missionId: string
  ): Promise<{ paid: number; waitlist: number; pending: number }> {
    const all = await this.list();
    let paid = 0;
    let waitlist = 0;
    let pending = 0;

    for (const reg of all) {
      const matchesMission =
        reg.missionId === missionId ||
        (!reg.missionId &&
          missionId === "00000000-0000-4000-a000-000000002027" &&
          reg.modality.includesAmazonasMission);

      if (!matchesMission) continue;

      if (reg.paymentStatus === "PAID") paid++;
      else if (reg.paymentStatus === "WAITLIST") waitlist++;
      else if (reg.paymentStatus === "PENDING") pending++;
    }

    return { paid, waitlist, pending };
  }

  async getMetrics(): Promise<EnrollmentMetrics> {
    const all = await this.list();

    let totalPaid = 0;
    let totalPending = 0;
    let totalWaitlist = 0;
    let totalCanceled = 0;
    let escolaTotal = 0;
    let missaoTotal = 0;
    let ambosTotal = 0;
    let missaoPaidSlots = 0;
    let totalRevenueCents = 0;
    let pendingRevenueCents = 0;

    for (const reg of all) {
      if (reg.paymentStatus === "PAID") {
        totalPaid++;
        totalRevenueCents += reg.amount.amountCents;

        if (reg.modality.includesAmazonasMission) {
          missaoPaidSlots++;
        }
      } else if (reg.paymentStatus === "PENDING") {
        totalPending++;
        pendingRevenueCents += reg.amount.amountCents;
      } else if (reg.paymentStatus === "WAITLIST") {
        totalWaitlist++;
      } else if (reg.paymentStatus === "CANCELED") {
        totalCanceled++;
      }

      if (reg.modality.type === "SCHOOL") escolaTotal++;
      if (reg.modality.type === "MISSION") missaoTotal++;
      if (reg.modality.type === "BOTH") ambosTotal++;
    }

    return {
      totalRegistrations: all.length,
      totalPaid,
      totalPending,
      totalWaitlist,
      totalCanceled,
      escolaTotal,
      missaoTotal,
      ambosTotal,
      missaoPaidSlots,
      missaoMaxSlots: 28,
      totalRevenueCents,
      pendingRevenueCents,
    };
  }
}
