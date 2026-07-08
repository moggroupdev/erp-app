import { Locale } from "@/lib/i18n/config";

export function formatDateAndTime(date: number | string | Date, locale: Locale) {
  return new Date(date).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

export function formatDate(date: number | string | Date, locale: Locale) {
  return new Date(date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(date: number | string | Date, locale: Locale) {
  return new Date(date).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function formatTimeOnly(date: number | string | Date, locale: Locale) {
  return new Date(date).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
