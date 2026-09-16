import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { AUDIT_ACTION_LABELS_LIST } from "@/lib/constants/enums/audit-actions";

export type SelectAuditActionProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `AUDIT_ACTION_*` enum labels.
 */
export default function SelectAuditAction(props: SelectAuditActionProps) {
  return <LocalizedSelect {...props} labelsList={AUDIT_ACTION_LABELS_LIST} />;
}
