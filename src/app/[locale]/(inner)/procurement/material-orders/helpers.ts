import { MATERIAL_PURCHASE_ORDER_UPDATE_WINDOW_MS } from "@/lib/constants/global";
import { resolveDisplayUnit, toBaseQuantity, toDisplayQuantity } from "@/lib/helpers/unit-conversion";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";

/** Convert an entered quantity from one material unit to another via the material base unit. */
export function convertEnteredQuantityBetweenUnits(
  quantity: number,
  fromUnit: MaterialUnit,
  toUnit: MaterialUnit,
  baseUnit: MaterialUnit,
  unitConversions: MaterialUnitConversionSummary[] = [],
): number {
  if (fromUnit === toUnit) return Number(quantity);

  const from = resolveDisplayUnit(fromUnit, baseUnit, unitConversions);
  const to = resolveDisplayUnit(toUnit, baseUnit, unitConversions);
  const baseQty = toBaseQuantity(Number(quantity), from.factor);
  return toDisplayQuantity(baseQty, to.factor);
}

export function materialPurchaseOrderUpdateBlock(
  order: { createdAt: string | Date; cancelledAt: string | Date | null; completedAt: string | Date | null },
  hasReceipt: boolean,
) {
  if (order.cancelledAt) return "cancelled" as const;
  if (order.completedAt) return "completed" as const;
  if (hasReceipt) return "receipt" as const;
  if (Date.now() > new Date(order.createdAt).getTime() + MATERIAL_PURCHASE_ORDER_UPDATE_WINDOW_MS) return "window" as const;
  return null;
}
