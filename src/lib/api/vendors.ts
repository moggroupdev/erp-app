import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  Vendor,
  VendorWithCreator,
  VendorAddress,
  CreateVendorDto,
  UpdateVendorDto,
  CreateVendorAddressDto,
} from "@/types/vendor";

const vendorsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateVendorDto }) {
    return await privateRequest<Vendor>({ method: "POST", url: "vendors", data: dto });
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
    return await privateRequest<PaginatedData<Vendor>>({ url: "vendors", params, signal });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<VendorWithCreator>({ url: `vendors/${id}`, signal });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateVendorDto }) {
    return await privateRequest<Vendor>({ method: "PUT", url: `vendors/${id}`, data: dto });
  },

  // ========================= Addresses =========================

  async addAddress({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: CreateVendorAddressDto;
  }) {
    return await privateRequest<VendorAddress>({ method: "POST", url: `vendors/${id}/addresses`, data: dto });
  },

  async listAddresses({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<VendorAddress[]>({ url: `vendors/${id}/addresses`, signal });
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
    return await privateRequest<VendorAddress>({
      method: "PUT",
      url: `vendors/${id}/addresses/${addressId}/default`,
    });
  },
};

export default vendorsApi;
