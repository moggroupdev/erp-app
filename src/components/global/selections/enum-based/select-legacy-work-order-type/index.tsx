import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { LEGACY_WORK_ORDER_TYPE_LABELS_LIST } from "@/lib/constants/enums/legacy-work-order-types";

export type SelectLegacyWorkOrderTypeProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `LEGACY_WORK_ORDER_TYPE_*` enum labels.
 */
export default function SelectLegacyWorkOrderType(props: SelectLegacyWorkOrderTypeProps) {
  return <LocalizedSelect {...props} labelsList={LEGACY_WORK_ORDER_TYPE_LABELS_LIST} />;
}
