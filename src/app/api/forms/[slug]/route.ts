import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { SupabaseFormRepository } from "@/modules/forms/infrastructure/persistence/SupabaseFormRepository";
import { SubmitFormResponseUseCase } from "@/modules/forms/application/use-cases/SubmitFormResponseUseCase";

const formRepo = new SupabaseFormRepository();
const submitUseCase = new SubmitFormResponseUseCase(formRepo);

const BOT_USER_AGENT_REGEX =
  /(bot|crawler|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|twitterbot|linkedinbot|headlesschrome|phantomjs|puppeteer|playwright|selenium|webdriver|curl|wget|python-requests|axios|node-fetch|go-http-client)/i;

function buildDeviceHash(request: NextRequest, deviceId: string): string | null {
  if (!deviceId || deviceId.length < 8) return null;
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown-ip";
  const ua = request.headers.get("user-agent") || "unknown-ua";
  return crypto
    .createHash("sha256")
    .update(`${deviceId}|${ip}|${ua}`)
    .digest("hex");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const form = await formRepo.findBySlug(slug);

    if (!form || form.status === "DRAFT") {
      return NextResponse.json(
        { error: "Formulário não encontrado." },
        { status: 404 }
      );
    }

    const effectiveStatus = form.isEffectivelyClosed()
      ? "CLOSED"
      : form.status;

    return NextResponse.json({
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description || "",
        status: effectiveStatus,
        questions: form.questions,
        limitOnePerDevice: form.settings.limitOnePerDevice,
        thankYouMessage: form.settings.thankYouMessage,
      },
    });
  } catch (err) {
    console.error("GET /api/forms/[slug] error:", err);
    return NextResponse.json(
      { error: "Erro ao carregar formulário." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOT_USER_AGENT_REGEX.test(ua)) {
    return NextResponse.json(
      { error: "Envio automático bloqueado." },
      { status: 403 }
    );
  }

  try {
    const { slug } = await context.params;
    const body = await request.json();

    if (body?.humanProof?.webdriver === true) {
      return NextResponse.json(
        { error: "Envio automático bloqueado." },
        { status: 403 }
      );
    }

    const deviceHash = buildDeviceHash(request, String(body?.deviceId || ""));

    const result = await submitUseCase.execute({
      slug,
      answers: body.answers || {},
      deviceHash,
      locale: String(body.locale || "pt"),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (err) {
    console.error("POST /api/forms/[slug] error:", err);
    return NextResponse.json(
      { error: "Erro interno ao enviar resposta." },
      { status: 500 }
    );
  }
}
