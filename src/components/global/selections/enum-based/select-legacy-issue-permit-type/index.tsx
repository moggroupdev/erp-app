import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { LEGACY_ISSUE_PERMIT_TYPE_LABELS_LIST } from "@/lib/constants/enums/legacy-issue-permit-types";

/**
 * Static select from `LEGACY_ISSUE_PERMIT_TYPE_*` enum labels.
 */
export default function SelectLegacyIssuePermitType(props: Omit<LocalizedSelectProps, "labelsList">) {
  return <LocalizedSelect {...props} labelsList={LEGACY_ISSUE_PERMIT_TYPE_LABELS_LIST} />;
}