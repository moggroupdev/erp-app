import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  Supplier,
  SupplierWithCreator,
  SupplierAddress,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateSupplierAddressDto,
} from "@/types/supplier";

const suppliersApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateSupplierDto }) {
    return await privateRequest<Supplier>({ method: "POST", url: "suppliers", data: dto });
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
    return await privateRequest<PaginatedData<Supplier>>({ url: "suppliers", params, signal });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<SupplierWithCreator>({ url: `suppliers/${id}`, signal });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateSupplierDto }) {
    return await privateRequest<Supplier>({ method: "PUT", url: `suppliers/${id}`, data: dto });
  },

  // ========================= Addresses =========================

  async addAddress({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: CreateSupplierAddressDto;
  }) {
    return await privateRequest<SupplierAddress>({ method: "POST", url: `suppliers/${id}/addresses`, data: dto });
  },

  async listAddresses({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<SupplierAddress[]>({ url: `suppliers/${id}/addresses`, signal });
  },

  async setDefaultAddress({
    privateRequest,
    id,
    addressId,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    addressId: string;
  }) {
    return await privateRequest<SupplierAddress>({
      method: "PUT",
      url: `suppliers/${id}/addresses/${addressId}/default`,
    });
  },
};

export default suppliersApi;
