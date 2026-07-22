import type { ProductSourceType } from "@/lib/constants/enums/product-source-types";
import type { DimensionUnit } from "@/lib/constants/enums/dimension-units";

export type Product = {
  code: string;
  title: string;
  description: string | null;
  subCategoryId: string;
  sourceType: ProductSourceType;
  estimatedProductionTime: number | null;
  pricingFactor: number;
  deletedAt: Date | null;
  createdAt: Date;
  createdBy: string;
};

export type ProductWithCreator = Product & { createdBy: { id: string; name: string } };

export type ProductDimension = {
  id: string;
  productCode: string;
  length: number;
  depth: number;
  height: number;
  dimensionUnit: DimensionUnit;
  isDefault: boolean;
  createdAt: Date;
  createdBy: string;
};

export type ProductWithDimensions = Product & { dimensions: ProductDimension[] };

// ==================== DTOs ====================

export type CreateProductDto = {
  title: string;
  description: string | null;
  subCategoryId: string;
  sourceType: ProductSourceType;
  estimatedProductionTime: number | null;
  pricingFactor: number;
};

export type UpdateProductDto = Partial<CreateProductDto>;

export type CreateProductDimensionDto = {
  length: number;
  depth: number;
  height: number;
  dimensionUnit: DimensionUnit;
  isDefault: boolean | null;
};
