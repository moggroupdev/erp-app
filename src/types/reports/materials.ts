import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { StockStatus } from "@/lib/constants/enums/derived/stock-statuses";

// ==================== Materials Inventory Summary ====================

export type MaterialsInventoryOverview = {
  totalMaterials: number;
  totalInventoryValue: number;
  totalOpeningValue: number;
  valueChangeAmount: number;
  valueChangePercentage: number;
  outOfStockCount: number;
  lowStockCount: number;
  noMinimumStockCount: number;
};

export type MaterialsInventoryByMaterialType = {
  materialType: MaterialType;
  count: number;
  totalQuantity: number;
  totalValue: number;
};

export type MaterialsInventoryByMainCategory = {
  mainCategoryId: string;
  mainCategoryTitle: string;
  count: number;
  totalValue: number;
};

export type MaterialsInventoryStockStatus = {
  status: StockStatus;
  count: number;
  totalValue: number;
};

export type MaterialsInventoryTopMaterial = {
  code: string;
  title: string;
  unit: MaterialUnit;
  quantity: number;
  unitCost: number;
  value: number;
};

export type MaterialsInventoryLowStockMaterial = {
  code: string;
  title: string;
  quantity: number;
  minimumStock: number;
  deficit: number;
};

export type MaterialsInventorySummary = {
  overview: MaterialsInventoryOverview;
  byMaterialType: MaterialsInventoryByMaterialType[];
  byMainCategory: MaterialsInventoryByMainCategory[];
  stockStatus: MaterialsInventoryStockStatus[];
  topMaterialsByValue: MaterialsInventoryTopMaterial[];
  lowStockMaterials: MaterialsInventoryLowStockMaterial[];
};
