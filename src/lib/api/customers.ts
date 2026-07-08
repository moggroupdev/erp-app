import type { PaginatedData } from "@/types/global";
import type { PrivateRequest, Dictionary } from "@/types/api";
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from "@/types/customer";

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
};

export default customersApi;
