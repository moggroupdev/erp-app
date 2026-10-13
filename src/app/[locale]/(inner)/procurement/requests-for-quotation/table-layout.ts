import type { CSSProperties } from "react";

export const RFQ_MATERIAL_COLUMN_MIN_WIDTH = {
  code: 100,
  item: 260,
  unit: 96,
  quantity: 112,
  notes: 220,
  remove: 44,
} as const;

export const RFQ_QUOTATION_LINE_COLUMN_MIN_WIDTH = {
  code: 100,
  item: 260,
  unit: 112,
  quantity: 112,
  unitPrice: 128,
  notes: 220,
} as const;

export const RFQ_COMPARISON_COLUMN_MIN_WIDTH = {
  material: 260,
  requested: 160,
  supplier: 176,
} as const;

export function sumColumnMinWidths(widths: number[]) {
  return widths.reduce((sum, width) => sum + width, 0);
}

export function columnMinWidthStyle(minWidth: number): CSSProperties {
  return { minWidth, whiteSpace: "nowrap" };
}

export function materialTableColumnWidths(includeRemove: boolean): number[] {
  const columns = RFQ_MATERIAL_COLUMN_MIN_WIDTH;
  const widths: number[] = [columns.code, columns.item, columns.unit, columns.quantity, columns.notes];
  if (includeRemove) widths.push(columns.remove);
  return widths;
}

export function quotationLineTableColumnWidths(): number[] {
  const columns = RFQ_QUOTATION_LINE_COLUMN_MIN_WIDTH;
  return [columns.code, columns.item, columns.unit, columns.quantity, columns.unitPrice, columns.notes];
}

export function comparisonTableColumnWidths(supplierCount: number): number[] {
  const columns = RFQ_COMPARISON_COLUMN_MIN_WIDTH;
  return [
    columns.material,
    columns.requested,
    ...Array.from({ length: supplierCount }, () => columns.supplier),
  ];
}

export const rfqTableHeaderClass = "text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase";
