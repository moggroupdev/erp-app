import type { MaterialPurchaseReceiptItem } from "@/types/material-purchase-order";

type ReceiptTransaction = NonNullable<MaterialPurchaseReceiptItem["transaction"]>;

/**
 * How receipt items relate to inventory transactions.
 *
 * - `empty`    — no receipt items; transaction UI is hidden
 * - `none`     — every item lacks a linked transaction → show a red notice in ReceiptDetails
 * - `single`   — all items share one transaction → show one linked number in ReceiptDetails
 * - `multiple` — items differ or only some are linked → per-item column in the items table
 */
export type ReceiptTransactionState =
  | { mode: "empty" }
  | { mode: "none" }
  | { mode: "single"; transaction: ReceiptTransaction }
  | { mode: "multiple" };

/** Classifies receipt items into one of the display modes above. */
export function getReceiptTransactionState(items: MaterialPurchaseReceiptItem[]): ReceiptTransactionState {
  if (items.length === 0) return { mode: "empty" };

  const transactions = items.map((item) => item.transaction);
  const withTransaction = transactions.filter((transaction): transaction is ReceiptTransaction => transaction != null);

  if (withTransaction.length === 0) return { mode: "none" };

  const uniqueIds = new Set(withTransaction.map((transaction) => transaction.id));
  if (uniqueIds.size === 1 && withTransaction.length === items.length)
    return { mode: "single", transaction: withTransaction[0] };

  return { mode: "multiple" };
}

/** Prefer legacy permit number; fall back to the system-generated transaction code. */
export function getReceiptTransactionLabel(transaction: ReceiptTransaction) {
  return transaction.legacyNumber || transaction.code;
}
