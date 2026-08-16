"use client";

import { DatePickerInput as MantineDatePickerInput, type DatePickerInputProps } from "@mantine/dates";

export type DatePickerInputFieldProps = Omit<DatePickerInputProps, "value" | "onChange"> & {
  value: string | null;
  onChange: (value: string | null) => void;
};

export default function DatePickerInput({ value, onChange, radius = "md", ...props }: DatePickerInputFieldProps) {
  return <MantineDatePickerInput value={value} onChange={onChange} radius={radius} {...props} />;
}
