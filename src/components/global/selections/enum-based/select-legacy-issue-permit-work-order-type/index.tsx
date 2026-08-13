import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS_LIST } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";

export type SelectLegacyIssuePermitWorkOrderTypeProps = Omit<LocalizedSelectProps, "labelsList"> & {
  excludeValues?: string[];
};

/**
 * Static select from `LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_*` enum labels.
 */
export default function SelectLegacyIssuePermitWorkOrderType({
  excludeValues = [],
  value,
  ...props
}: SelectLegacyIssuePermitWorkOrderTypeProps) {
  const labelsList = LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS_LIST.filter(
    (item) => item.value === value || !excludeValues.includes(item.value),
  );

  return <LocalizedSelect {...props} value={value} labelsList={labelsList} />;
}
