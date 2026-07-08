import { type NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { NEXT_LOCALE_COOKIE } from "@/lib/constants/global";

/**
 * Handles locale detection and redirection for requests without locale prefix
 */
export function handleLocalization(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
  if (pathnameHasLocale) return null;

  const locale = getLocale(request);

  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  newUrl.search = request.nextUrl.search;

  return NextResponse.redirect(newUrl);
}

/**
 * Detects the user's preferred locale from cookie, headers, or default
 */
function getLocale(request: NextRequest): string {
  // 1. Check cookie
  const cookieLocale = request.cookies.get(NEXT_LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().toLowerCase())
      .find((lang) => locales.some((locale) => lang.startsWith(locale)));

    if (preferredLocale) {
      const matched = locales.find((locale) => preferredLocale.startsWith(locale));
      if (matched) return matched;
    }
  }

  // 3. Default locale
  return defaultLocale;
}
