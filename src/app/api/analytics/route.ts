import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  SupabaseAnalyticsRepository,
  AnalyticsEventType,
} from "@/modules/analytics/infrastructure/SupabaseAnalyticsRepository";

const BOT_USER_AGENT_REGEX =
  /(bot|crawler|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|twitterbot|linkedinbot|pinterest|bingpreview|googlebot|yandex|baidu|duckduckbot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|headlesschrome|phantomjs|puppeteer|playwright|selenium|webdriver|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|curl|wget|python-requests|python-urllib|axios|node-fetch|undici|go-http-client|java\/|okhttp|postman|insomnia|httpie)/i;

function isLikelyBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  if (!ua || ua.length < 12) return true;
  if (BOT_USER_AGENT_REGEX.test(ua)) return true;

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") return true;

  return false;
}

function buildAnonymousVisitorHash(
  request: NextRequest,
  visitorId: string
): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown-ip";
  const ua = request.headers.get("user-agent") || "unknown-ua";

  // Anonymous SHA-256 hash (LGPD compliant: raw IP is never persisted)
  return crypto
    .createHash("sha256")
    .update(`${visitorId}|${ip}|${ua}`)
    .digest("hex");
}

const repo = new SupabaseAnalyticsRepository();

export async function GET() {
  const summary = await repo.getSummary();
  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request: NextRequest) {
  if (isLikelyBot(request)) {
    return NextResponse.json({ ignored: true, reason: "bot_filtered" });
  }

  try {
    const body = await request.json();
    const eventType = body?.eventType as AnalyticsEventType;
    const visitorId = String(body?.visitorId || "").trim();
    const source = String(body?.source || "web").slice(0, 64);
    const locale = String(body?.locale || "pt").slice(0, 8);
    const humanProof = body?.humanProof || {};

    if (eventType !== "VISIT" && eventType !== "INTEREST") {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
    }

    if (visitorId.length < 8) {
      return NextResponse.json({ ignored: true, reason: "invalid_visitor" });
    }

    if (humanProof.webdriver === true) {
      return NextResponse.json({ ignored: true, reason: "webdriver_detected" });
    }

    if (
      eventType === "VISIT" &&
      (!humanProof.interacted || Number(humanProof.dwellMs || 0) < 1200)
    ) {
      return NextResponse.json({ ignored: true, reason: "insufficient_human_proof" });
    }

    if (eventType === "INTEREST" && !humanProof.interacted) {
      return NextResponse.json({ ignored: true, reason: "no_interaction" });
    }

    const visitorHash = buildAnonymousVisitorHash(request, visitorId);
    const summary = await repo.recordEvent({
      visitorHash,
      eventType,
      source,
      locale,
    });

    return NextResponse.json({
      ok: true,
      ...summary,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
