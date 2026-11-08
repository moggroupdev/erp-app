import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS_LIST } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";

/**
 * Static select from `LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_*` enum labels.
 */
export default function SelectLegacyIssuePermitMaintenanceOrderType(
  props: Omit<LocalizedSelectProps, "labelsList">,
) {
  return <LocalizedSelect {...props} labelsList={LEGACY_ISSUE_PERMIT_MAINTENANCE_ORDER_TYPE_LABELS_LIST} />;
}