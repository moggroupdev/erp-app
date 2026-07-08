import { useI18n } from "@/lib/i18n/hooks";
import { LocalizedLabel } from "@/lib/i18n/types";
import DataSelect, { GenericDataSelectProps } from "./data-select";

export interface LocalizedSelectProps extends Omit<GenericDataSelectProps, "data"> {
  labelsList: LocalizedLabel<string>[];
}

export default function LocalizedSelect({ labelsList, ...props }: LocalizedSelectProps) {
  const { translate } = useI18n();

  const data = labelsList.map((item) => ({
    value: item.value,
    label: translate(item.label.en, item.label.ar),
  }));

  return <DataSelect {...props} data={data} />;
}
