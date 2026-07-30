import type { ProductSourceType } from "@/lib/constants/enums/product-source-types";
import type { DimensionUnit } from "@/lib/constants/enums/dimension-units";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialType } from "@/lib/constants/enums/material-types";

export type BomItem = {
  id: string;
  productDimensionId: string;
  materialCode: string;
  quantityRequired: number;
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
  };
};

export type BomItemWithMaterial = {
  id: string;
  productDimensionId: string;
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
    manufacturedMaterialBoms: BomMmComponent[];
  };
};

export type Bom = {
  id: string;
  productCode: string;
  length: number;
  depth: number;
  height: number;
  dimensionUnit: DimensionUnit;
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
  notes: string | null;
};

export type CreateBomDto = { items: CreateBomItemDto[] };

export type UpdateBomItemDto = Partial<Pick<CreateBomItemDto, "quantityRequired" | "notes">>;
