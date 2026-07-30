import { TEMP_GLOBAL_MANUFACTURING_COST } from "@/lib/constants/global";
import { isManufacturedMaterial } from "@/lib/constants/enums/material-types";
import type { BomItemWithMaterial, BomMmComponent } from "@/types/bom";

export const UNCATEGORIZED_ID = "__uncategorized__";

export type FlattenedBomRow = {
  id: string;
  materialCode: string;
  quantityRequired: number;
  notes: string | null;
  material: BomItemWithMaterial["material"] | BomMmComponent["material"];
  parentManufacturedMaterialTitle: string | null;
  sourceBomItem: BomItemWithMaterial | null;
};

export type ManufacturingCostRow = {
  id: string;
  materialCode: string;
  materialTitle: string;
  quantityRequired: number;
  unitManufacturingCost: number;
  totalManufacturingCost: number;
};

export type BomDisplayTotals = {
  totalMaterialCost: number;
  totalManufacturingCost: number;
  grandTotalCost: number;
  estimatedUnitPrice: number;
  itemCount: number;
  manufacturingItemCount: number;
};

export function getFlattenedMaterialRows(items: BomItemWithMaterial[]): FlattenedBomRow[] {
  const rows: FlattenedBomRow[] = [];

  for (const item of items) {
    if (isManufacturedMaterial(item.material.materialType)) {
      for (const component of item.material.manufacturedMaterialBoms ?? []) {
        rows.push({
          id: `${item.id}:${component.id}`,
          materialCode: component.materialCode,
          quantityRequired: item.quantityRequired * component.quantityRequired,
          notes: component.notes,
          material: component.material,
          parentManufacturedMaterialTitle: item.material.title,
          sourceBomItem: null,
        });
      }

      continue;
    }

    rows.push({
      id: item.id,
      materialCode: item.materialCode,
      quantityRequired: item.quantityRequired,
      notes: item.notes,
      material: item.material,
      parentManufacturedMaterialTitle: null,
      sourceBomItem: item,
    });
  }

  return rows;
}

export function getManufacturingCostRows(items: BomItemWithMaterial[]): ManufacturingCostRow[] {
  return items
    .filter((item) => isManufacturedMaterial(item.material.materialType))
    .map((item) => ({
      id: item.id,
      materialCode: item.material.code,
      materialTitle: item.material.title,
      quantityRequired: item.quantityRequired,
      unitManufacturingCost: TEMP_GLOBAL_MANUFACTURING_COST,
      totalManufacturingCost: item.quantityRequired * TEMP_GLOBAL_MANUFACTURING_COST,
    }));
}

export function getBomDisplayTotals(args: {
  materialRows: FlattenedBomRow[];
  manufacturingRows: ManufacturingCostRow[];
  pricingFactor: number;
}): BomDisplayTotals {
  const totalMaterialCost = args.materialRows.reduce((sum, row) => sum + row.quantityRequired * row.material.unitPrice, 0);
  const totalManufacturingCost = args.manufacturingRows.reduce((sum, row) => sum + row.totalManufacturingCost, 0);
  const grandTotalCost = totalMaterialCost + totalManufacturingCost;

  return {
    totalMaterialCost,
    totalManufacturingCost,
    grandTotalCost,
    estimatedUnitPrice: grandTotalCost * args.pricingFactor,
    itemCount: args.materialRows.length,
    manufacturingItemCount: args.manufacturingRows.length,
  };
}
