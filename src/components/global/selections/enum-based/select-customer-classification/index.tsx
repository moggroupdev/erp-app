import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { CUSTOMER_CLASSIFICATION_LABELS_LIST } from "@/lib/constants/enums/customer-classifications";

export type SelectCustomerClassificationProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `CUSTOMER_CLASSIFICATION_*` enum labels.
 */
export default function SelectCustomerClassification(props: SelectCustomerClassificationProps) {
  return <LocalizedSelect {...props} labelsList={CUSTOMER_CLASSIFICATION_LABELS_LIST} />;
}
