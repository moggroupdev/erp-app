import type { ProductSourceType } from "@/lib/constants/enums/product-source-types";

export type Product = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  legacyCode: string | null;
  subCategoryId: string;
  sourceType: ProductSourceType;
  estimatedProductionTime: number | null;
  pricingFactor: number;
  deletedAt: Date | null;
  createdAt: Date;
  createdBy: { id: string; name: string };
};

// ==================== DTOs ====================

export type CreateProductDto = Omit<Product, "id" | "code" | "legacyCode" | "deletedAt" | "createdAt" | "createdBy">;

export type UpdateProductDto = Partial<CreateProductDto>;
