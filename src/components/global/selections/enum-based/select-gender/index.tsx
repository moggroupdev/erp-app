import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { GENDER_LABELS_LIST } from "@/lib/constants/enums/genders";

export type SelectGenderProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `GENDER_*` enum labels.
 */
export default function SelectGender(props: SelectGenderProps) {
  return <LocalizedSelect {...props} labelsList={GENDER_LABELS_LIST} />;
}
