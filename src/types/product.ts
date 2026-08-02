import type { ProductSourceType } from "@/lib/constants/enums/product-source-types";

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
  length: number | null;
  depth: number | null;
  diameter: number | null;
  height: number;
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
  length: number | null;
  depth: number | null;
  diameter: number | null;
  height: number;
  isDefault: boolean | null;
};
