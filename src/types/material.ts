import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MmSourcingType } from "@/lib/constants/enums/mm-sourcing-types";

export type Material = {
  code: string;
  legacyCode: string | null;
  title: string;
  description: string | null;
  subCategoryId: string;
  materialType: MaterialType;
  unitOfMeasurement: MaterialUnit;
  unitPrice: number;
  quantity: number;
  openingUnitPrice: number | null;
  openingQuantity: number | null;
  minimumStock: number | null;
  marketUnitPrice: number | null;
  marketUnitPriceSetAt: Date | null;
  marketUnitPriceSetBy: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  createdBy: string;
};

export type MaterialUnitConversion = {
  id: string;
  materialCode: string;
  unit: MaterialUnit;
  conversionFactorToBase: number;
  createdAt: Date;
  createdBy: string;
};

export type MaterialUnitConversionSummary = Pick<MaterialUnitConversion, "id" | "unit" | "conversionFactorToBase">;

export type MaterialWithCreator = Omit<Material, "createdBy" | "marketUnitPriceSetBy"> & {
  createdBy: { id: string; name: string };
  marketUnitPriceSetBy: { id: string; name: string } | null;
};

export type MaterialWithUnitConversions = Material & { unitConversions: MaterialUnitConversionSummary[] };

export type MaterialWithCreatorAndUnitConversions = MaterialWithCreator & {
  unitConversions: MaterialUnitConversionSummary[];
};

/** List rows or detail fetches in material selection flows. */
export type MaterialWithUnitConversionsSelection = MaterialWithUnitConversions | MaterialWithCreatorAndUnitConversions;

// ==================== DTOs ====================

export type CreateMaterialDto = {
  title: string;
  description: string | null;
  subCategoryId: string;
  materialType: MaterialType;
  unitOfMeasurement: MaterialUnit;
  legacyCode: string | null;
  minimumStock: number | null;
};

export type UpdateMaterialDto = Omit<Partial<CreateMaterialDto>, "materialType">;

export type CreateMaterialUnitConversionDto = {
  unit: MaterialUnit;
  conversionFactorToBase: number;
};

export type SetMaterialMarketPriceDto = {
  marketUnitPrice: number;
};

export type SetMaterialTypeDto = {
  materialType: MaterialType;
  defaultMmSourcingType?: MmSourcingType;
  confirmed?: boolean;
};

export type MaterialTypeChangeImpact = {
  currentType: MaterialType;
  targetType: MaterialType;
  blocked: boolean;
  blockReason: string | null;
  affectedBomLines: {
    id: string;
    productDimensionId: string;
    productCode: string;
    productTitle: string;
  }[];
};
