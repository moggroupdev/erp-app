import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";

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
  marketUnitPriceSetBy: string | { id: string; name: string } | null;
  deletedAt: Date | null;
  createdAt: Date;
  createdBy: string | { id: string; name: string };
};

export type MaterialUnitConversion = {
  id: string;
  materialCode: string;
  unit: MaterialUnit;
  conversionFactorToBase: number;
  createdAt: Date;
  createdBy: string | { id: string; name: string };
};

export type MaterialUnitConversionSummary = Pick<MaterialUnitConversion, "id" | "unit" | "conversionFactorToBase">;

export type MaterialWithCreator = Material & { createdBy: { id: string; name: string } };

export type MaterialWithUnitConversions = Material & { unitConversions: MaterialUnitConversionSummary[] };

export type MaterialWithCreatorAndUnitConversions = MaterialWithCreator & {
  unitConversions: MaterialUnitConversionSummary[];
};

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

export type UpdateMaterialDto = Partial<CreateMaterialDto>;

export type CreateMaterialUnitConversionDto = {
  unit: MaterialUnit;
  conversionFactorToBase: number;
};

export type SetMaterialMarketPriceDto = {
  marketUnitPrice: number;
};
