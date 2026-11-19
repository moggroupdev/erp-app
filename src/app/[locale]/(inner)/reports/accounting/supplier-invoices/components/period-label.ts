import type { GroupBy } from "../../../purchasing-materials/components/date-range-filter";

const ARABIC_QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "الربع الأول",
  2: "الربع الثاني",
  3: "الربع الثالث",
  4: "الربع الرابع",
};

function parsePeriodParts(period: string): { year: number; month: number } | null {
  const match = period.match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function formatPeriodLabel(period: string, locale: string, groupBy: GroupBy): string {
  const parts = parsePeriodParts(period);
  if (!parts) return period;

  const { year, month } = parts;
  const localeTag = locale === "ar" ? "ar-EG" : "en-US";

  if (groupBy === "year") return String(year);

  if (groupBy === "quarter") {
    const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
    return locale === "ar" ? `${ARABIC_QUARTER_LABELS[quarter]} لعام ${year}` : `Q${quarter} ${year}`;
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString(localeTag, { year: "numeric", month: "short", timeZone: "UTC" });
}
