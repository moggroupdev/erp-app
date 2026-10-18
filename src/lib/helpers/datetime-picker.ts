import dayjs from "dayjs";

export function toDateTimePickerValue(date: Date | string) {
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : null;
}

export function toDatePickerValue(date: Date | string) {
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
}

export function dateTimePickerValueToIso(value: string | null) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate().toISOString() : null;
}

/** Date-only picker value stored as 14:00 in the browser's local timezone. */
export function dateOnlyToTwoPmIso(value: string | null) {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.hour(14).minute(0).second(0).millisecond(0).toDate().toISOString();
}