import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";

export type Material = {
  code: string;
  legacyCode: string | null;
  title: string;
  description: string | null;
  subCategoryId: string;
  materialType: MaterialType;
  unit: MaterialUnit;
  unitCost: number;
  quantity: number;
  openingUnitCost: number | null;
  openingQuantity: number | null;
  minimumStock: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  createdBy: string;
};

export type MaterialWithCreator = Material & { createdBy: { id: string; name: string } };

// ==================== DTOs ====================

export type CreateMaterialDto = {
  title: string;
  description: string | null;
  subCategoryId: string;
  materialType: MaterialType;
  unit: MaterialUnit;
  legacyCode: string | null;
  minimumStock: number | null;
};

export type UpdateMaterialDto = Partial<CreateMaterialDto>;
