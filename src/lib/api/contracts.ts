import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { ContractDetailed, ContractListItem } from "@/types/contract";

const contractsApi = {
  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<ContractListItem>>({ url: "contracts", params, signal });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<ContractDetailed>({ url: `contracts/${id}`, signal });
  },
};

export default contractsApi;
