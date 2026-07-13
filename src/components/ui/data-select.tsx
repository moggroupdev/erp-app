import { Select, SelectProps } from "@mantine/core";
import { ChevronDown, CircleX } from "lucide-react";

export interface GenericDataSelectProps extends Omit<SelectProps, "data" | "value" | "onChange"> {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  data: { value: string; label: string }[];
  clearable?: boolean;
  rightIcon?: React.ReactNode;
}

export default function DataSelect({
  value,
  setValue,
  data,
  clearable,
  rightIcon,
  ...mantineProps
}: GenericDataSelectProps) {
  const defaultIcon = rightIcon || <ChevronDown size={12} className="pointer-events-none text-gray-400" />;

  return (
    <Select
      radius="md"
      {...mantineProps}
      data={data}
      value={value}
      onChange={(val) => setValue(val)}
      rightSection={
        value && clearable ? (
          <CircleX
            size={15}
            className="cursor-pointer text-red-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the dropdown from opening
              setValue(null);
            }}
          />
        ) : (
          defaultIcon
        )
      }
      rightSectionPointerEvents={value && clearable ? "all" : "none"}
    />
  );
}
