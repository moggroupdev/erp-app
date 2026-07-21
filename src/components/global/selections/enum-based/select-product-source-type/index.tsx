import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { PRODUCT_SOURCE_TYPE_LABELS_LIST } from "@/lib/constants/enums/product-source-types";

export type SelectProductSourceTypeProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `PRODUCT_SOURCE_TYPE_*` enum labels.
 */
export default function SelectProductSourceType(props: SelectProductSourceTypeProps) {
  return <LocalizedSelect {...props} labelsList={PRODUCT_SOURCE_TYPE_LABELS_LIST} />;
}
