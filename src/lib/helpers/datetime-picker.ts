import dayjs from "dayjs";

export function toDateTimePickerValue(date: Date | string) {
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : null;
}

export function dateTimePickerValueToIso(value: string | null) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate().toISOString() : null;
}