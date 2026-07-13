import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  Customer,
  CustomerAddress,
  CreateCustomerDto,
  CreateCustomerAddressDto,
  UpdateCustomerDto,
} from "@/types/customer";

const customersApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateCustomerDto }) {
    return await privateRequest<Customer>({ method: "POST", url: "customers", data: dto });
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
    return await privateRequest<PaginatedData<Customer>>({ url: "customers", params, signal });
  },

  async get({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<Customer>({ url: `customers/${id}` });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateCustomerDto }) {
    return await privateRequest<Customer>({ method: "PUT", url: `customers/${id}`, data: dto });
  },

  // ========================= Addresses =========================

  async addAddress({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: CreateCustomerAddressDto;
  }) {
    return await privateRequest<CustomerAddress>({ method: "POST", url: `customers/${id}/addresses`, data: dto });
  },

  async listAddresses({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<CustomerAddress[]>({ url: `customers/${id}/addresses` });
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
    return await privateRequest<CustomerAddress>({
      method: "PUT",
      url: `customers/${id}/addresses/${addressId}/default`,
    });
  },
};

export default customersApi;
