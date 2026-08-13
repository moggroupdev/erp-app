"use client";

import dayjs from "dayjs";
import { DateTimePicker, type DateTimePickerProps } from "@mantine/dates";

export type DateTimePickerInputProps = Omit<DateTimePickerProps, "value" | "onChange"> & {
  value: string | null;
  onChange: (value: string | null) => void;
};

export function toDateTimePickerValue(date: Date | string) {
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : null;
}

export function dateTimePickerValueToIso(value: string | null) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate().toISOString() : null;
}

export default function DateTimePickerInput({ value, onChange, radius = "md", ...props }: DateTimePickerInputProps) {
  return <DateTimePicker value={value} onChange={onChange} radius={radius} {...props} />;
}