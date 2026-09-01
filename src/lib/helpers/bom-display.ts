import { getEnteredQuantityInBaseUnit } from "@/lib/helpers/unit-conversion";
import { TEMP_GLOBAL_MANUFACTURING_COST } from "@/lib/constants/global";
import { isManufacturedMaterial } from "@/lib/constants/enums/material-types";
import { COSTING_METHODS, type CostingMethod } from "@/lib/constants/enums/derived/costing-methods";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { BomItemWithMaterial, BomMmComponent } from "@/types/bom";
import type { MmBom } from "@/types/mm-bom";

export const UNCATEGORIZED_ID = "__uncategorized__";

export type FlattenedBomRow = {
  id: string;
  materialCode: string;
  quantityRequired: number;
  unitOfMeasurementSelected: MaterialUnit | null;
  notes: string | null;
  material: BomItemWithMaterial["material"] | BomMmComponent["material"];
  parentManufacturedMaterialTitle: string | null;
  sourceBomItem: BomItemWithMaterial | null;
  productionSubDepartment: ProductionSubDepartment | null;
  manufacturedComponentContext?: {
    parentQuantity: number;
    parentUnit: MaterialUnit | null;
    parentMaterial: UnitConvertibleMaterial;
    componentQuantity: number;
    componentUnit: MaterialUnit | null;
  };
};

export type ManufacturingCostRow = {
  id: string;
  materialCode: string;
  materialTitle: string;
  quantityRequired: number;
  unitManufacturingCost: number;
  totalManufacturingCost: number;
  productionSubDepartment: ProductionSubDepartment | null;
  sourceBomItem: BomItemWithMaterial;
};

export type BomDisplayTotals = {
  totalMaterialCost: number;
  totalManufacturingCost: number;
  grandTotalCost: number;
  estimatedUnitPrice: number;
  itemCount: number;
  manufacturingItemCount: number;
};

export type AggregatedComponentRequirement = {
  materialCode: string;
  materialTitle: string;
  unitOfMeasurement: MaterialUnit;
  quantityRequired: number;
};

// Materials that were never purchased have no last purchase price, so they cost nothing under that method.
export function getMaterialCostPrice(
  material: { unitPrice: number; lastPurchasePrice: number | null },
  costingMethod: CostingMethod,
): number {
  if (costingMethod === COSTING_METHODS.LAST_PURCHASE_PRICE) return material.lastPurchasePrice ?? 0;
  return material.unitPrice;
}

type UnitConvertibleMaterial = {
  unitOfMeasurement: MaterialUnit;
  unitConversions: { unit: MaterialUnit; conversionFactorToBase: number }[];
};

export function getMaterialLineCost(
  quantity: number,
  unitOfMeasurementSelected: MaterialUnit | null | undefined,
  material: UnitConvertibleMaterial & { unitPrice: number; lastPurchasePrice: number | null },
  costingMethod: CostingMethod,
): number {
  const baseQuantity = getEnteredQuantityInBaseUnit(quantity, unitOfMeasurementSelected, material);
  return baseQuantity * getMaterialCostPrice(material, costingMethod);
}

export function getFlattenedMaterialRows(items: BomItemWithMaterial[]): FlattenedBomRow[] {
  const rows: FlattenedBomRow[] = [];

  for (const item of items) {
    if (isManufacturedMaterial(item.material.materialType)) {
      for (const component of item.material.manufacturedMaterialBoms ?? []) {
        const componentUnit = component.unitOfMeasurementSelected ?? component.material.unitOfMeasurement;

        rows.push({
          id: `${item.id}:${component.id}`,
          materialCode: component.materialCode,
          quantityRequired: item.quantityRequired * component.quantityRequired,
          unitOfMeasurementSelected: componentUnit,
          notes: component.notes,
          material: component.material,
          parentManufacturedMaterialTitle: item.material.title,
          sourceBomItem: null,
          productionSubDepartment: item.productionSubDepartment,
          manufacturedComponentContext: {
            parentQuantity: item.quantityRequired,
            parentUnit: item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement,
            parentMaterial: item.material,
            componentQuantity: component.quantityRequired,
            componentUnit,
          },
        });
      }

      continue;
    }

    rows.push({
      id: item.id,
      materialCode: item.materialCode,
      quantityRequired: item.quantityRequired,
      unitOfMeasurementSelected: item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement,
      notes: item.notes,
      material: item.material,
      parentManufacturedMaterialTitle: null,
      sourceBomItem: item,
      productionSubDepartment: item.productionSubDepartment,
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
      productionSubDepartment: item.productionSubDepartment,
      sourceBomItem: item,
    }));
}

export function getFlattenedRowLineCost(row: FlattenedBomRow, costingMethod: CostingMethod): number {
  if (row.manufacturedComponentContext) {
    const ctx = row.manufacturedComponentContext;
    const parentBaseQuantity = getEnteredQuantityInBaseUnit(ctx.parentQuantity, ctx.parentUnit, ctx.parentMaterial);
    const componentBaseQuantity = getEnteredQuantityInBaseUnit(
      ctx.componentQuantity,
      ctx.componentUnit,
      row.material,
    );

    return parentBaseQuantity * componentBaseQuantity * getMaterialCostPrice(row.material, costingMethod);
  }

  return getMaterialLineCost(row.quantityRequired, row.unitOfMeasurementSelected, row.material, costingMethod);
}

export function getBomDisplayTotals(args: {
  materialRows: FlattenedBomRow[];
  manufacturingRows: ManufacturingCostRow[];
  pricingFactor: number;
  costingMethod: CostingMethod;
}): BomDisplayTotals {
  const totalMaterialCost = args.materialRows.reduce(
    (sum, row) => sum + getFlattenedRowLineCost(row, args.costingMethod),
    0,
  );
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

export function aggregateMmComponentRequirements(
  selections: { mmBom: MmBom | undefined; multiplier: number }[],
): AggregatedComponentRequirement[] {
  const byMaterialCode = new Map<string, AggregatedComponentRequirement>();

  for (const { mmBom, multiplier } of selections) {
    if (!mmBom || multiplier <= 0) continue;

    for (const component of mmBom.manufacturedMaterialBoms) {
      const componentBaseQuantity = getEnteredQuantityInBaseUnit(
        component.quantityRequired,
        component.unitOfMeasurementSelected,
        component.material,
      );
      const quantityRequired = componentBaseQuantity * multiplier;
      const existing = byMaterialCode.get(component.materialCode);

      if (existing) {
        existing.quantityRequired += quantityRequired;
        continue;
      }

      byMaterialCode.set(component.materialCode, {
        materialCode: component.materialCode,
        materialTitle: component.material.title,
        unitOfMeasurement: component.material.unitOfMeasurement,
        quantityRequired,
      });
    }
  }

  return Array.from(byMaterialCode.values());
}

export type MmComponentGroup = {
  key: string;
  materialCode: string;
  materialTitle: string;
  unitOfMeasurement: MaterialUnit | null;
  quantityRequired: number | null;
  components: AggregatedComponentRequirement[];
};

export function groupMmComponentRequirements(
  selections: {
    key: string;
    materialCode: string;
    materialTitle: string;
    unitOfMeasurement: MaterialUnit | null;
    quantityRequired: number | null;
    mmBom: MmBom | undefined;
  }[],
): MmComponentGroup[] {
  return selections.map((selection) => {
    const multiplier =
      typeof selection.quantityRequired === "number" && selection.quantityRequired > 0 ? selection.quantityRequired : 1;

    return {
      key: selection.key,
      materialCode: selection.materialCode,
      materialTitle: selection.materialTitle,
      unitOfMeasurement: selection.unitOfMeasurement,
      quantityRequired: selection.quantityRequired,
      components: aggregateMmComponentRequirements([{ mmBom: selection.mmBom, multiplier }]),
    };
  });
}
