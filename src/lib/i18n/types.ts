import type { Locale } from "./config";
import type { Translation } from "./translations/en";

export { type Locale };
export { type Translation };

export type LocalizedLabel<T extends string> = { value: T; label: Record<Locale, string> };
export type LocalizedEntity<T extends string> = Record<T, LocalizedLabel<T>>;

export type LocaleParam = Promise<{ locale: string }>;

// Type helpers for Next.js 15+ async params
export type LocalePageProps = { params: LocaleParam };
export type LocaleLayoutProps = { params: LocaleParam; children: React.ReactNode };
export type DynamicLocalePageProps<T extends Record<string, string>> = { params: Promise<{ locale: string } & T> };
