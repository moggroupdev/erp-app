import { getEnteredQuantityInBaseUnit } from "@/lib/helpers/unit-conversion";
import { isManufacturedMaterial } from "@/lib/constants/enums/material-types";
import {
  isExternallyManufacturedMmSourcing,
  usesMmRecipe,
} from "@/lib/constants/enums/mm-sourcing-types";
import {
  COSTING_METHODS,
  ITEM_COSTING_METHODS,
  type CostingMethod,
  type ItemCostingMethod,
} from "@/lib/constants/enums/derived/costing-methods";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { BomItemWithMaterial, BomMmComponent } from "@/types/bom";
import type { MmBom } from "@/types/mm-bom";

export const UNCATEGORIZED_ID = "__uncategorized__";

export type QuantityDisplayMode = "required" | "legacy";

export type MaterialCostPriceFields = {
  unitPrice: number;
  lastPurchasePrice: number | null;
  marketUnitPrice?: number | null;
};

export type FlattenedBomRow = {
  id: string;
  materialCode: string;
  quantityRequired: number;
  legacyQuantity?: number | null;
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
  legacyQuantity?: number | null;
  unitManufacturingCost: number;
  totalManufacturingCost: number;
  productionSubDepartment: ProductionSubDepartment | null;
  notes: string | null;
  sourceBomItem: BomItemWithMaterial;
};

export type BomDisplayTotals = {
  totalMaterialCost: number;
  totalManufacturingCost: number;
  grandTotalCost: number;
  estimatedUnitPrice: number | null;
  itemCount: number;
  manufacturingItemCount: number;
};

export type AggregatedComponentRequirement = {
  materialCode: string;
  materialTitle: string;
  unitOfMeasurement: MaterialUnit;
  quantityRequired: number;
};

export function getRowCostingMethod(
  rowId: string,
  bomCostingMethod: CostingMethod,
  overrides: Record<string, ItemCostingMethod> | undefined,
): ItemCostingMethod {
  return overrides?.[rowId] ?? bomCostingMethod;
}

// Materials that were never purchased have no last purchase price, so they cost nothing under that method.
export function getMaterialCostPrice(
  material: MaterialCostPriceFields,
  costingMethod: ItemCostingMethod,
): number {
  if (costingMethod === COSTING_METHODS.LAST_PURCHASE_PRICE) return material.lastPurchasePrice ?? 0;
  if (costingMethod === ITEM_COSTING_METHODS.MARKET_PRICE) return material.marketUnitPrice ?? 0;
  return material.unitPrice;
}

type UnitConvertibleMaterial = {
  unitOfMeasurement: MaterialUnit;
  unitConversions: { unit: MaterialUnit; conversionFactorToBase: number }[];
};

export function getMaterialLineCost(
  quantity: number,
  unitOfMeasurementSelected: MaterialUnit | null | undefined,
  material: UnitConvertibleMaterial & MaterialCostPriceFields,
  costingMethod: ItemCostingMethod,
): number {
  const baseQuantity = getEnteredQuantityInBaseUnit(quantity, unitOfMeasurementSelected, material);
  return baseQuantity * getMaterialCostPrice(material, costingMethod);
}

function includeInQuantityMode(
  item: { quantityRequired: number; noLongerUsed: boolean },
  quantityMode: QuantityDisplayMode,
) {
  if (quantityMode === "legacy") return true;
  // Retired lines stay visible at quantity 0. Other zero rows are not valid.
  return item.quantityRequired > 0 || item.noLongerUsed;
}

export function getFlattenedMaterialRows(
  items: BomItemWithMaterial[],
  quantityMode: QuantityDisplayMode = "required",
): FlattenedBomRow[] {
  const rows: FlattenedBomRow[] = [];
  const filteredItems = items.filter((item) => includeInQuantityMode(item, quantityMode));

  for (const item of filteredItems) {
    const expandRecipe =
      isManufacturedMaterial(item.material.materialType) && usesMmRecipe(item.mmSourcingType);

    const parentQty =
      quantityMode === "legacy" ? (item.legacyQuantity ?? 0) : item.quantityRequired;

    if (expandRecipe) {
      for (const component of item.material.manufacturedMaterialBoms ?? []) {
        const componentUnit = component.unitOfMeasurementSelected ?? component.material.unitOfMeasurement;
        const compQty = component.quantityRequired;
        // MM recipes have no legacy quantity; scale the parent line, or stay null when the parent has none.
        const scaledLegacyQuantity = item.legacyQuantity == null ? null : item.legacyQuantity * compQty;

        rows.push({
          id: `${item.id}:${component.id}`,
          materialCode: component.materialCode,
          quantityRequired: parentQty * compQty,
          legacyQuantity: scaledLegacyQuantity,
          unitOfMeasurementSelected: componentUnit,
          notes: component.notes,
          material: component.material,
          parentManufacturedMaterialTitle: item.material.title,
          sourceBomItem: null,
          productionSubDepartment: item.productionSubDepartment,
          manufacturedComponentContext: {
            parentQuantity: parentQty,
            parentUnit: item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement,
            parentMaterial: item.material,
            componentQuantity: compQty,
            componentUnit,
          },
        });
      }

      continue;
    }

    // Raw/spare, purchased MM, or legacy null-sourcing MM: price as a normal material row.
    const qty = quantityMode === "legacy" ? (item.legacyQuantity ?? 0) : item.quantityRequired;

    rows.push({
      id: item.id,
      materialCode: item.materialCode,
      quantityRequired: qty,
      legacyQuantity: item.legacyQuantity,
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

export function getManufacturingCostRows(
  items: BomItemWithMaterial[],
  quantityMode: QuantityDisplayMode = "required",
): ManufacturingCostRow[] {
  const filteredItems = items.filter((item) => includeInQuantityMode(item, quantityMode));

  return filteredItems
    .filter(
      (item) =>
        isManufacturedMaterial(item.material.materialType) && usesMmRecipe(item.mmSourcingType),
    )
    .map((item) => {
      const unitManufacturingCost = isExternallyManufacturedMmSourcing(item.mmSourcingType)
        ? (item.material.lastOutsourcingCost ?? 0)
        : 0;
      const qty = quantityMode === "legacy" ? (item.legacyQuantity ?? 0) : item.quantityRequired;
      const baseQuantity = getEnteredQuantityInBaseUnit(
        qty,
        item.unitOfMeasurementSelected ?? item.material.unitOfMeasurement,
        item.material,
      );

      return {
        id: item.id,
        materialCode: item.material.code,
        materialTitle: item.material.title,
        quantityRequired: qty,
        legacyQuantity: item.legacyQuantity,
        unitManufacturingCost,
        totalManufacturingCost: baseQuantity * unitManufacturingCost,
        productionSubDepartment: item.productionSubDepartment,
        notes: item.notes,
        sourceBomItem: item,
      };
    });
}

export function getFlattenedRowLineCost(row: FlattenedBomRow, costingMethod: ItemCostingMethod): number {
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
  pricingFactor: number | null | undefined;
  costingMethod: CostingMethod;
  itemCostingOverrides?: Record<string, ItemCostingMethod>;
}): BomDisplayTotals {
  const totalMaterialCost = args.materialRows.reduce((sum, row) => {
    const method = getRowCostingMethod(row.id, args.costingMethod, args.itemCostingOverrides);
    return sum + getFlattenedRowLineCost(row, method);
  }, 0);
  const totalManufacturingCost = args.manufacturingRows.reduce((sum, row) => sum + row.totalManufacturingCost, 0);
  const grandTotalCost = totalMaterialCost + totalManufacturingCost;
  const pricingFactor = args.pricingFactor != null ? Number(args.pricingFactor) : null;

  return {
    totalMaterialCost,
    totalManufacturingCost,
    grandTotalCost,
    estimatedUnitPrice: pricingFactor != null && pricingFactor > 0 ? grandTotalCost * pricingFactor : null,
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
