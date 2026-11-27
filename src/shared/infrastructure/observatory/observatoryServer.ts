import crypto from "crypto";

const DEFAULT_INGEST_URL = "https://yesode.com/api/observatory/events";

export function verifyObservatoryHmac(headers: Headers): boolean {
  const secret = (process.env.OBSERVATORY_SERVICE_SECRET || "").trim();
  if (!secret) return false;

  const tsRaw = headers.get("x-observatory-timestamp") || "";
  const nonce = headers.get("x-observatory-nonce") || "";
  const sigRaw = headers.get("x-observatory-signature") || "";
  const ts = Number.parseInt(tsRaw, 10);

  if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) {
    return false;
  }
  if (!/^[a-f0-9]{16,64}$/i.test(nonce)) return false;

  const sigHex = sigRaw.startsWith("sha256=") ? sigRaw.slice(7).trim() : sigRaw.trim();
  if (!/^[a-f0-9]{64}$/i.test(sigHex)) return false;

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(`${ts}.${nonce}.`)
    .digest("hex");

  const a = Buffer.from(sigHex.toLowerCase(), "utf8");
  const b = Buffer.from(expectedHex.toLowerCase(), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function reportObservatoryServerError(params: {
  errorName?: string;
  message: string;
  stack?: string | null;
  route?: string;
  severity?: "info" | "warning" | "error" | "critical";
  diagnosticCode?: string;
  meta?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const secret = (process.env.OBSERVATORY_SERVICE_SECRET || "").trim();
  if (!secret || process.env.OBSERVATORY_ENABLED === "false") return;

  const ingestUrl = (process.env.OBSERVATORY_INGEST_URL || DEFAULT_INGEST_URL).trim();
  const payload = JSON.stringify({
    service: "moven",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
    errorName: (params.errorName || "ServerError").slice(0, 100),
    message: (params.message || "Unknown server error").slice(0, 1500),
    stack: params.stack ? params.stack.slice(0, 4000) : null,
    route: params.route || "/api",
    severity: params.severity || "error",
    release: process.env.NEXT_PUBLIC_APP_COMMIT || process.env.NEXT_PUBLIC_APP_VERSION || null,
    diagnosticCode: params.diagnosticCode,
    meta: params.meta,
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${payload}`)
    .digest("hex");

  try {
    await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Observatory-Service": "moven",
        "X-Observatory-Timestamp": timestamp,
        "X-Observatory-Nonce": nonce,
        "X-Observatory-Signature": `sha256=${signature}`,
      },
      body: payload,
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    // Fail-safe: telemetry never interrupts Moven business routes
  }
}
