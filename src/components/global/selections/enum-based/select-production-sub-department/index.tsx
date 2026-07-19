import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { PRODUCTION_SUB_DEPARTMENT_LABELS_LIST } from "@/lib/constants/enums/production-sub-departments";

export type SelectProductionSubDepartmentProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `PRODUCTION_SUB_DEPARTMENT_*` enum labels.
 * Unlike department/role/location selects, this does not fetch remote data.
 */
export default function SelectProductionSubDepartment(props: SelectProductionSubDepartmentProps) {
  return <LocalizedSelect {...props} labelsList={PRODUCTION_SUB_DEPARTMENT_LABELS_LIST} />;
}
