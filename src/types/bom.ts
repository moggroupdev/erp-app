import type { ProductSourceType } from "@/lib/constants/enums/product-source-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary } from "@/types/material";

export type BomItem = {
  id: string;
  productDimensionId: string;
  materialCode: string;
  quantityRequired: number;
  productionSubDepartment: ProductionSubDepartment | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type BomMmComponent = {
  id: string;
  materialCode: string;
  quantityRequired: number;
  notes: string | null;
  material: {
    code: string;
    title: string;
    materialType: MaterialType;
    subCategoryId: string;
    unitOfMeasurement: MaterialUnit;
    unitPrice: number;
    lastPurchasePrice: number | null;
    unitConversions: MaterialUnitConversionSummary[];
  };
};

export type BomItemWithMaterial = {
  id: string;
  productDimensionId: string;
  materialCode: string;
  quantityRequired: number;
  productionSubDepartment: ProductionSubDepartment | null;
  notes: string | null;
  material: {
    code: string;
    title: string;
    materialType: MaterialType;
    subCategoryId: string;
    unitOfMeasurement: MaterialUnit;
    unitPrice: number;
    lastPurchasePrice: number | null;
    unitConversions: MaterialUnitConversionSummary[];
    // For manufactured materials, we need to get the components of the material
    manufacturedMaterialBoms: BomMmComponent[];
  };
};

export type Bom = {
  id: string;
  productCode: string;
  length: number | null;
  depth: number | null;
  diameter: number | null;
  height: number;
  isDefault: boolean;
  product: {
    code: string;
    title: string;
    subCategoryId: string;
    sourceType: ProductSourceType;
    estimatedProductionTime: number | null;
    pricingFactor: number;
  };
  standardBoms: BomItemWithMaterial[];
};

// ==================== DTOs ====================

export type CreateBomItemDto = {
  materialCode: string;
  quantityRequired: number;
  productionSubDepartment: ProductionSubDepartment;
  unit?: MaterialUnit;
  notes: string | null;
};

export type CreateBomDto = { items: CreateBomItemDto[] };

export type UpdateBomItemDto = Partial<Pick<CreateBomItemDto, "quantityRequired" | "unit" | "notes">> & {
  productionSubDepartment: ProductionSubDepartment;
};
