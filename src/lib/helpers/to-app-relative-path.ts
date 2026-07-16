import { BASE_URL } from "@/lib/constants/global";
import { validationRegex } from "@/lib/constants/regex";
import { getPathnameWithoutLocale } from "@/lib/i18n/utils";

/**
 * Turns a user-entered home URL (absolute or relative) into an app-relative path
 * for the API. Strips origin, query/hash, and locale prefix.
 *
 * @example
 * toAppRelativePath("https://app.moggroup.net/ar/warehouse/materials")
 * // → "/warehouse/materials"
 *
 * toAppRelativePath("/en/procurement/material-orders")
 * // → "/procurement/material-orders"
 */
export default function toAppRelativePath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let pathname: string;

  try {
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
      const href = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
      pathname = new URL(href).pathname;
    } else if (trimmed.startsWith("/")) {
      pathname = trimmed.split(/[?#]/, 1)[0] ?? trimmed;
    } else {
      return null;
    }
  } catch {
    return null;
  }

  const withoutLocale = getPathnameWithoutLocale(pathname);
  const withLeadingSlash = withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
  const normalized =
    withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;

  if (!validationRegex.path.test(normalized)) return null;
  return normalized;
}

/** Prefills the home URL input with a full app link for the current locale. */
export function toAppHomeUrlInput(relativePath: string | null | undefined, locale: string): string {
  if (!relativePath?.trim()) return "";
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${BASE_URL}/${locale}${path}`;
}
