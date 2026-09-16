import dayjs from "dayjs";

export function dateToStartOfDayIso(date: string | null) {
  if (!date) return null;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.startOf("day").toISOString() : null;
}

export function dateToEndOfDayIso(date: string | null) {
  if (!date) return null;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.endOf("day").toISOString() : null;
}
