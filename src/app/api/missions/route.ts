import { NextResponse } from "next/server";
import { SupabaseMissionRepository } from "@/modules/mission-catalog/infrastructure/SupabaseMissionRepository";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";

const missionRepo = new SupabaseMissionRepository();
const registrationRepo = new SupabaseRegistrationRepository();

export async function GET() {
  try {
    const activeMissions = await missionRepo.listActive();

    const missions = await Promise.all(
      activeMissions.map(async (m) => {
        const counts = await registrationRepo.countByMission(m.id);
        return {
          id: m.id,
          slug: m.slug,
          title: m.title,
          subtitle: m.subtitle,
          description: m.description,
          location: m.location,
          startDate: m.startDate,
          endDate: m.endDate,
          priceCents: m.price.amountCents,
          priceFormatted: m.price.formatted,
          minSlots: m.minSlots,
          maxSlots: m.maxSlots,
          paidCount: counts.paid,
          waitlistCount: counts.waitlist,
          pendingCount: counts.pending,
          isWaitlistMode: m.isWaitlistMode(counts.paid),
          canEnroll: m.canEnroll(counts.paid),
          isFeatured: m.isFeatured,
          status: m.status,
        };
      })
    );

    return NextResponse.json({ missions });
  } catch (err) {
    console.error("API /api/missions error:", err);
    return NextResponse.json(
      { error: "Erro ao carregar missões disponíveis." },
      { status: 500 }
    );
  }
}

