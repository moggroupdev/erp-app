import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  Product,
  ProductWithCreator,
  ProductWithDimensions,
  ProductDimension,
  ProductProductionRoute,
  CreateProductDto,
  UpdateProductDto,
  CreateProductDimensionDto,
  UpdateProductDimensionDto,
  SetProductProductionRoutesDto,
  SetProductPricingFactorDto,
} from "@/types/product";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";

export type ProductExcelColumnOptions = {
  reviewEstimate?: boolean;
  addedToDatabase?: boolean;
  design?: boolean;
  completionDate?: boolean;
  notes?: boolean;
};

export type ProductsPrintFilters = {
  keyword?: string;
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  sourceType?: string | null;
};

const productsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateProductDto }) {
    return await privateRequest<Product>({ method: "POST", url: "products", data: dto });
  },

  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<ProductWithDimensions>>({ url: "products", params, signal });
  },

  async listAllToPrint({
    privateRequest,
    signal,
    filters = {},
  }: {
    privateRequest: PrivateRequest;
    signal?: AbortSignal;
    filters?: ProductsPrintFilters;
  }) {
    const result = await privateRequest<PaginatedData<ProductWithDimensions>>({
      url: "products",
      params: {
        limit: Infinity,
        sort: "title",
        ...removeEmptyParams({
          keyword: filters.keyword,
          mainCategoryId: filters.mainCategoryId,
          subCategoryId: filters.subCategoryId,
          sourceType: filters.sourceType,
        }),
      },
      signal,
    });

    return result.data;
  },

  async downloadExcel({
    privateRequest,
    columns = {},
    filters = {},
  }: {
    privateRequest: PrivateRequest;
    columns?: ProductExcelColumnOptions;
    filters?: ProductsPrintFilters;
  }) {
    return await privateRequest<null>({
      url: "products/excel",
      params: {
        ...removeEmptyColumnFlags(columns),
        ...removeEmptyParams({
          keyword: filters.keyword,
          mainCategoryId: filters.mainCategoryId,
          subCategoryId: filters.subCategoryId,
          sourceType: filters.sourceType,
        }),
      },
      download: true,
      filename: "products-catalog.xlsx",
    });
  },

  async get({ privateRequest, code, signal }: { privateRequest: PrivateRequest; code: string; signal?: AbortSignal }) {
    return await privateRequest<ProductWithCreator>({ url: `products/${code}`, signal });
  },

  async update({ privateRequest, code, dto }: { privateRequest: PrivateRequest; code: string; dto: UpdateProductDto }) {
    return await privateRequest<Product>({ method: "PUT", url: `products/${code}`, data: dto });
  },

  async setPricingFactor({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: SetProductPricingFactorDto;
  }) {
    return await privateRequest<Product>({ method: "PATCH", url: `products/${code}/pricing-factor`, data: dto });
  },

  // ========================= Dimensions =========================

  async addDimension({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: CreateProductDimensionDto;
  }) {
    return await privateRequest<ProductDimension>({ method: "POST", url: `products/${code}/dimensions`, data: dto });
  },

  async listDimensions({
    privateRequest,
    code,
    signal,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<ProductDimension[]>({ url: `products/${code}/dimensions`, signal });
  },

  async updateDimension({
    privateRequest,
    code,
    dimensionId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dimensionId: string;
    dto: UpdateProductDimensionDto;
  }) {
    return await privateRequest<ProductDimension>({
      method: "PUT",
      url: `products/${code}/dimensions/${dimensionId}`,
      data: dto,
    });
  },

  async setDefaultDimension({
    privateRequest,
    code,
    dimensionId,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dimensionId: string;
  }) {
    return await privateRequest<ProductDimension>({
      method: "PUT",
      url: `products/${code}/dimensions/${dimensionId}/default`,
    });
  },

  // ========================= Production Routes =========================

  async setProductionRoutes({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: SetProductProductionRoutesDto;
  }) {
    return await privateRequest<ProductProductionRoute[]>({
      method: "PUT",
      url: `products/${code}/production-routes`,
      data: dto,
    });
  },

  async listProductionRoutes({
    privateRequest,
    code,
    signal,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<ProductProductionRoute[]>({ url: `products/${code}/production-routes`, signal });
  },
};

function removeEmptyColumnFlags(columns: ProductExcelColumnOptions): Dictionary {
  const params: Dictionary = {};
  if (columns.reviewEstimate) params.reviewEstimate = true;
  if (columns.addedToDatabase) params.addedToDatabase = true;
  if (columns.design) params.design = true;
  if (columns.completionDate) params.completionDate = true;
  if (columns.notes) params.notes = true;
  return params;
}

export default productsApi;
