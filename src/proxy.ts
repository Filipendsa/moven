import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, LOCALE_COOKIE_NAME, isValidLocale, Locale } from "./i18n/config";

function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLang = request.headers.get("accept-language") || "";
  const candidates = acceptLang
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase().slice(0, 2));

  for (const code of candidates) {
    if (isValidLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal Next.js paths, API routes, Admin panel (PT only), and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  const locale = getPreferredLocale(request);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
