import type { Locale, LocaleParam } from "./types";
import { defaultLocale, locales } from "./config";
import { en } from "./translations/en";
import { ar } from "./translations/ar";

export function getLocaleFromPathname(pathname: string) {
  for (const locale of locales) if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) return locale;
  return defaultLocale;
}

export async function getLocaleFromParams(params: LocaleParam) {
  const { locale } = await params;
  return locale as Locale;
}

// =============================================================

export function translate(locale: Locale, en: string, ar: string) {
  switch (locale) {
    case "en":
      return en;
    case "ar":
      return ar;
    default:
      throw new Error(`Unsupported locale: ${locale}`);
  }
}

export function createTranslator(locale: Locale) {
  return (en: string, ar: string) => translate(locale, en, ar);
}

export async function createTranslatorFromParams(params: LocaleParam) {
  const locale = await getLocaleFromParams(params);
  return createTranslator(locale);
}

// =============================================================

const translations = { en, ar };

export function getTranslation(locale: Locale) {
  return translations[locale];
}

export async function getTranslationFromParams(params: LocaleParam) {
  const locale = await getLocaleFromParams(params);
  return getTranslation(locale);
}

// =============================================================

export function getI18n(locale: Locale) {
  const translate = createTranslator(locale);
  const translation = getTranslation(locale);
  return { locale, translate, translation };
}

// Most popular function used in server side pages
export async function getI18nFromParams(params: LocaleParam) {
  const locale = await getLocaleFromParams(params);
  const translate = createTranslator(locale);
  const translation = getTranslation(locale);
  return { locale, translate, translation };
}

// =============================================================

// Most popular function used to get the localized href
export const getLocalizedHref = (locale: string, path = "") => `/${locale}${path}`;

// =============================================================

export function getPathnameWithoutLocale(pathname: string) {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
    if (pathname === `/${locale}`) return "/";
  }
  return pathname;
}
