import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { DIMENSION_UNIT_LABELS_LIST } from "@/lib/constants/enums/dimension-units";

export type SelectDimensionUnitProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `DIMENSION_UNIT_*` enum labels.
 */
export default function SelectDimensionUnit(props: SelectDimensionUnitProps) {
  return <LocalizedSelect {...props} labelsList={DIMENSION_UNIT_LABELS_LIST} />;
}
