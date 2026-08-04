import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { INVENTORY_TRANSACTION_TYPE_LABELS_LIST } from "@/lib/constants/enums/inventory-transaction-types";

export type SelectInventoryTransactionTypeProps = Omit<LocalizedSelectProps, "labelsList">;

/**
 * Static select from `INVENTORY_TRANSACTION_TYPE_*` enum labels.
 */
export default function SelectInventoryTransactionType(props: SelectInventoryTransactionTypeProps) {
  return <LocalizedSelect {...props} labelsList={INVENTORY_TRANSACTION_TYPE_LABELS_LIST} />;
}
