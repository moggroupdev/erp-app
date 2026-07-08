"use client";

import type { Locale } from "./types";
import { getLocaleFromPathname, createTranslator, getTranslation } from "./utils";
import { usePathname } from "next/navigation";
import { getPathnameWithoutLocale } from "@/lib/i18n/utils";
import { locales } from "@/lib/i18n/config";
import { NEXT_LOCALE_COOKIE } from "@/lib/constants/global";

export function useLocale(): Locale {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  return locale;
}

// Most popular hook used in client side components
export function useI18n() {
  const locale = useLocale();
  const translate = createTranslator(locale);
  const translation = getTranslation(locale);
  return { locale, translate, translation };
}

// Most popular hook used to get the localized href
export function useLocaleHref() {
  const locale = useLocale();
  const getLocalizedHref = (path: string) => `/${locale}${path}`;
  return getLocalizedHref;
}

export function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();

  const currentIndex = locales.indexOf(locale);
  const nextLocale = locales[(currentIndex + 1) % locales.length];

  const switchLocale = (callback?: () => void) => {
    const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);
    const queryString = typeof window !== "undefined" ? window.location.search : "";
    const newPath = `/${nextLocale}${pathnameWithoutLocale}${queryString}`;
    document.cookie = `${NEXT_LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    callback?.();
    // Full reload so <html lang/dir> update from SSR (avoids React 19 script-in-component warning).
    window.location.assign(newPath);
  };

  return { nextLocale, switchLocale };
}
