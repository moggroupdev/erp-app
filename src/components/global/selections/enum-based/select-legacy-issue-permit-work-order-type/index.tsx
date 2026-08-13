import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS_LIST } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";

export type SelectLegacyIssuePermitWorkOrderTypeProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_*` enum labels.
 */
export default function SelectLegacyIssuePermitWorkOrderType(props: SelectLegacyIssuePermitWorkOrderTypeProps) {
  return <LocalizedSelect {...props} labelsList={LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPE_LABELS_LIST} />;
}
