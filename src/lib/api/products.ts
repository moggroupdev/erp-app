import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  Product,
  ProductWithCreator,
  ProductWithDimensions,
  ProductDimension,
  CreateProductDto,
  UpdateProductDto,
  CreateProductDimensionDto,
} from "@/types/product";

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

  async listAllToPrint({ privateRequest, signal }: { privateRequest: PrivateRequest; signal?: AbortSignal }) {
    const result = await privateRequest<PaginatedData<ProductWithDimensions>>({
      url: "products",
      params: { limit: Infinity, sort: "title" },
      signal,
    });

    return result.data;
  },

  async get({ privateRequest, code, signal }: { privateRequest: PrivateRequest; code: string; signal?: AbortSignal }) {
    return await privateRequest<ProductWithCreator>({ url: `products/${code}`, signal });
  },

  async update({ privateRequest, code, dto }: { privateRequest: PrivateRequest; code: string; dto: UpdateProductDto }) {
    return await privateRequest<Product>({ method: "PUT", url: `products/${code}`, data: dto });
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
};

export default productsApi;
