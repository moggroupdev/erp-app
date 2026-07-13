import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { Vendor, VendorAddress, CreateVendorDto, CreateVendorAddressDto, UpdateVendorDto } from "@/types/vendor";

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

  async get({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<Vendor>({ url: `vendors/${id}` });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateVendorDto }) {
    return await privateRequest<Vendor>({ method: "PUT", url: `vendors/${id}`, data: dto });
  },

  async getAddresses({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<VendorAddress[]>({ url: `vendors/${id}/addresses` });
  },

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
