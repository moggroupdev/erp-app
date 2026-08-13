"use client";

import { DateTimePicker, type DateTimePickerProps } from "@mantine/dates";

export type DateTimePickerInputProps = Omit<DateTimePickerProps, "value" | "onChange"> & {
  value: string | null;
  onChange: (value: string | null) => void;
};

export default function DateTimePickerInput({ value, onChange, radius = "md", ...props }: DateTimePickerInputProps) {
  return <DateTimePicker value={value} onChange={onChange} radius={radius} {...props} />;
}