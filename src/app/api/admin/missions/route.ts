import { NextResponse } from "next/server";
import { SupabaseMissionRepository } from "@/modules/mission-catalog/infrastructure/SupabaseMissionRepository";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";
import { Mission, MissionStatus } from "@/modules/mission-catalog/domain/entities/Mission";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";

const missionRepo = new SupabaseMissionRepository();
const registrationRepo = new SupabaseRegistrationRepository();

export async function GET() {
  try {
    const all = await missionRepo.listAll();
    const missions = await Promise.all(
      all.map(async (m) => {
        const counts = await registrationRepo.countByMission(m.id);
        return {
          id: m.id,
          slug: m.slug,
          title: m.title,
          subtitle: m.subtitle || "",
          description: m.description,
          location: m.location,
          startDate: m.startDate,
          endDate: m.endDate,
          priceCents: m.price.amountCents,
          priceFormatted: m.price.formatted,
          minSlots: m.minSlots,
          maxSlots: m.maxSlots,
          waitlistEnabled: m.waitlistEnabled,
          even3CheckoutUrl: m.even3CheckoutUrl || "",
          isFeatured: m.isFeatured,
          isActive: m.isActive,
          status: m.status,
          paidCount: counts.paid,
          waitlistCount: counts.waitlist,
          pendingCount: counts.pending,
        };
      })
    );

    return NextResponse.json({ missions });
  } catch (err) {
    console.error("API /api/admin/missions GET error:", err);
    return NextResponse.json(
      { error: "Erro ao listar missões." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const priceCents = Math.round(Number(body.priceCents || 0));
    const moneyRes = Money.fromCents(priceCents);
    if (!moneyRes.success) {
      return NextResponse.json({ error: moneyRes.error.message }, { status: 400 });
    }

    const slug =
      body.slug ||
      String(body.title || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const missionRes = Mission.create(
      {
        slug,
        title: body.title,
        subtitle: body.subtitle || undefined,
        description: body.description || "",
        location: body.location || "",
        startDate: body.startDate || "",
        endDate: body.endDate || "",
        price: moneyRes.value,
        minSlots: Number(body.minSlots || 28),
        maxSlots: body.maxSlots ? Number(body.maxSlots) : null,
        waitlistEnabled: body.waitlistEnabled !== false,
        even3CheckoutUrl: body.even3CheckoutUrl || undefined,
        isFeatured: Boolean(body.isFeatured),
        isActive: body.isActive !== false,
        status: (body.status as MissionStatus) || "OPEN",
      },
      body.id || undefined
    );

    if (!missionRes.success) {
      return NextResponse.json(
        { error: missionRes.error.message },
        { status: 400 }
      );
    }

    await missionRepo.save(missionRes.value);
    return NextResponse.json({ success: true, id: missionRes.value.id }, { status: 201 });
  } catch (err) {
    console.error("API /api/admin/missions POST error:", err);
    return NextResponse.json(
      { error: "Erro ao salvar missão." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "ID da missão é obrigatório." }, { status: 400 });
    }

    if (action === "feature") {
      await missionRepo.setFeatured(id);
      return NextResponse.json({ success: true });
    }

    const existing = await missionRepo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Missão não encontrada." }, { status: 404 });
    }

    const updatedRes = Mission.create(
      {
        slug: body.slug ?? existing.slug,
        title: body.title ?? existing.title,
        subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
        description: body.description ?? existing.description,
        location: body.location ?? existing.location,
        startDate: body.startDate ?? existing.startDate,
        endDate: body.endDate ?? existing.endDate,
        price:
          body.priceCents !== undefined
            ? (Money.fromCents(Number(body.priceCents)) as any).value || existing.price
            : existing.price,
        minSlots: body.minSlots !== undefined ? Number(body.minSlots) : existing.minSlots,
        maxSlots: body.maxSlots !== undefined ? (body.maxSlots ? Number(body.maxSlots) : null) : existing.maxSlots,
        waitlistEnabled:
          body.waitlistEnabled !== undefined
            ? Boolean(body.waitlistEnabled)
            : existing.waitlistEnabled,
        even3CheckoutUrl:
          body.even3CheckoutUrl !== undefined
            ? body.even3CheckoutUrl
            : existing.even3CheckoutUrl,
        isFeatured:
          body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
        isActive:
          body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        status: (body.status as MissionStatus) ?? existing.status,
        createdAt: existing.createdAt,
      },
      existing.id
    );

    if (!updatedRes.success) {
      return NextResponse.json({ error: updatedRes.error.message }, { status: 400 });
    }

    await missionRepo.save(updatedRes.value);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API /api/admin/missions PATCH error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar missão." },
      { status: 500 }
    );
  }
}

