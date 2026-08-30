import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { SUPPLIER_CLASSIFICATION_LABELS_LIST } from "@/lib/constants/enums/supplier-classifications";

export type SelectSupplierClassificationProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `SUPPLIER_CLASSIFICATION_*` enum labels.
 */
export default function SelectSupplierClassification(props: SelectSupplierClassificationProps) {
  return <LocalizedSelect {...props} labelsList={SUPPLIER_CLASSIFICATION_LABELS_LIST} />;
}
