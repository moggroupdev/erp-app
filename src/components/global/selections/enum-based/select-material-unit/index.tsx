import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { MATERIAL_UNIT_LABELS_LIST } from "@/lib/constants/enums/material-units";

export type SelectMaterialUnitProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `MATERIAL_UNIT_*` enum labels.
 */
export default function SelectMaterialUnit(props: SelectMaterialUnitProps) {
  return <LocalizedSelect {...props} labelsList={MATERIAL_UNIT_LABELS_LIST} />;
}
