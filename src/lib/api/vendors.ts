import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { Vendor, CreateVendorDto, UpdateVendorDto } from "@/types/vendor";

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
};

export default vendorsApi;
