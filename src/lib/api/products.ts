import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { Product, CreateProductDto, UpdateProductDto } from "@/types/product";

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
    return await privateRequest<PaginatedData<Product>>({ url: "products", params, signal });
  },

  async get({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<Product>({ url: `products/${id}` });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateProductDto }) {
    return await privateRequest<Product>({
      method: "PUT",
      url: `products/${id}`,
      data: dto,
    });
  },
};

export default productsApi;
