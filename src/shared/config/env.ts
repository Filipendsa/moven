function assertEnv(value: string | undefined, name: string): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `[MOVEN Config] Missing required environment variable: ${name}. Check .env.local or Vercel Environment Variables.`
    );
  }
  return value.trim();
}

export type AppLocale = "pt" | "es" | "en";

export const publicEnv = {
  get appUrl(): string {
    return assertEnv(process.env.NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL");
  },
  get paymentMode(): "EVEN3" | "INFINITEPAY" {
    return process.env.NEXT_PUBLIC_PAYMENT_MODE === "INFINITEPAY"
      ? "INFINITEPAY"
      : "EVEN3";
  },
  get supabaseUrl(): string {
    return assertEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL"
    );
  },
  get supabasePublishableKey(): string {
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return assertEnv(key, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  },
  get isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return Boolean(url && !url.includes("placeholder"));
  },
  get pixKey(): string {
    return assertEnv(process.env.NEXT_PUBLIC_PIX_KEY, "NEXT_PUBLIC_PIX_KEY");
  },
  get receiptWhatsapp(): string {
    return assertEnv(
      process.env.NEXT_PUBLIC_RECEIPT_WHATSAPP,
      "NEXT_PUBLIC_RECEIPT_WHATSAPP"
    );
  },
  get receiptContactName(): string {
    return process.env.NEXT_PUBLIC_RECEIPT_CONTACT_NAME?.trim() || "Gadiel";
  },
  get communityWhatsapp(): string {
    return assertEnv(
      process.env.NEXT_PUBLIC_COMMUNITY_WHATSAPP,
      "NEXT_PUBLIC_COMMUNITY_WHATSAPP"
    );
  },
  get communityContactName(): string {
    return process.env.NEXT_PUBLIC_COMMUNITY_CONTACT_NAME?.trim() || "Henrique";
  },
  get poweredByUrl(): string {
    return (
      process.env.NEXT_PUBLIC_POWERED_BY_URL?.trim() || "https://yesode.com"
    );
  },
  get defaultLocale(): AppLocale {
    const loc = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
    if (loc === "es" || loc === "en") return loc;
    return "pt";
  },
};

export const serverEnv = {
  get supabaseSecretKey(): string {
    const key =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return assertEnv(key, "SUPABASE_SECRET_KEY");
  },
  get infinitePayApiKey(): string | undefined {
    return process.env.INFINITEPAY_API_KEY?.trim() || undefined;
  },
  get infinitePayWebhookSecret(): string | undefined {
    return process.env.INFINITEPAY_WEBHOOK_SECRET?.trim() || undefined;
  },
  get infinitePayApiUrl(): string {
    return (
      process.env.INFINITEPAY_API_URL?.trim() ||
      "https://api.infinitepay.io/v2/transactions/checkout"
    );
  },
  get even3SchoolCheckoutUrl(): string {
    return assertEnv(
      process.env.EVEN3_SCHOOL_CHECKOUT_URL,
      "EVEN3_SCHOOL_CHECKOUT_URL"
    );
  },
  get even3MissionCheckoutUrl(): string {
    return assertEnv(
      process.env.EVEN3_MISSION_CHECKOUT_URL,
      "EVEN3_MISSION_CHECKOUT_URL"
    );
  },
};
