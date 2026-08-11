import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";

export type MmBomItem = {
  id: string;
  manufacturedMaterialCode: string;
  materialCode: string;
  quantityRequired: number;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type MmBomItemWithMaterial = {
  id: string;
  manufacturedMaterialCode: string;
  materialCode: string;
  quantityRequired: number;
  notes: string | null;
  material: {
    code: string;
    title: string;
    subCategoryId: string;
    materialType: MaterialType;
    unitOfMeasurement: MaterialUnit;
    unitPrice: number;
    unitConversions: MaterialUnitConversionSummary[];
  };
};

export type MmBom = {
  code: string;
  title: string;
  description: string | null;
  subCategoryId: string;
  materialType: MaterialType;
  unitOfMeasurement: MaterialUnit;
  unitPrice: number;
  quantity: number;
  manufacturedMaterialBoms: MmBomItemWithMaterial[];
};

// ==================== DTOs ====================

export type CreateMmBomItemDto = {
  materialCode: string;
  quantityRequired: number;
  unit?: MaterialUnit;
  notes: string | null;
};

export type UpdateMmBomItemDto = Partial<Pick<CreateMmBomItemDto, "quantityRequired" | "unit" | "notes">>;
