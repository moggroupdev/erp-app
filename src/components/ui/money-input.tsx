import { NumberInput } from "@mantine/core";

export default function MoneyInput({
  value,
  setValue,
  label,
  placeholder,
  required,
}: {
  value: number | string;
  setValue: React.Dispatch<React.SetStateAction<number | string>>;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <NumberInput
      value={value}
      onChange={setValue}
      label={label}
      placeholder={placeholder}
      required={required}
      clampBehavior="strict"
      decimalScale={2}
      allowNegative={false}
      min={0}
      radius="md"
    />
  );
}
