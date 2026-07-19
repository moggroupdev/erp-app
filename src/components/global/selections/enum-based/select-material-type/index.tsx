import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { MATERIAL_TYPE_LABELS_LIST } from "@/lib/constants/enums/material-types";

export type SelectMaterialTypeProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `MATERIAL_TYPE_*` enum labels.
 */
export default function SelectMaterialType(props: SelectMaterialTypeProps) {
  return <LocalizedSelect {...props} labelsList={MATERIAL_TYPE_LABELS_LIST} />;
}
