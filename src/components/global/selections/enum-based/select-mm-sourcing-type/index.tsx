import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { MM_SOURCING_TYPE_LABELS_LIST } from "@/lib/constants/enums/mm-sourcing-types";

export type SelectMmSourcingTypeProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `MM_SOURCING_TYPE_*` enum labels.
 */
export default function SelectMmSourcingType(props: SelectMmSourcingTypeProps) {
  return <LocalizedSelect {...props} labelsList={MM_SOURCING_TYPE_LABELS_LIST} />;
}
