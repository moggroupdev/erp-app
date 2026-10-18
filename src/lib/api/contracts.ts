import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  ContractDetailed,
  ContractListItem,
  CreatedLegacyContract,
  CreateLegacyContractDto,
  ValidateLegacyContractDto,
  ValidateLegacyContractItemsDto,
  ValidateLegacyContractUnitsDto,
} from "@/types/contract";

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

  async validateLegacyContract({
    privateRequest,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dto: ValidateLegacyContractDto;
  }) {
    return await privateRequest<{ ok: true }>({ method: "POST", url: "contracts/legacy/validate-contract", data: dto });
  },

  async validateLegacyItems({
    privateRequest,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dto: ValidateLegacyContractItemsDto;
  }) {
    return await privateRequest<{ ok: true }>({ method: "POST", url: "contracts/legacy/validate-items", data: dto });
  },

  async validateLegacyUnits({
    privateRequest,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dto: ValidateLegacyContractUnitsDto;
  }) {
    return await privateRequest<{ ok: true }>({ method: "POST", url: "contracts/legacy/validate-units", data: dto });
  },

  async createLegacy({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateLegacyContractDto }) {
    return await privateRequest<CreatedLegacyContract>({ method: "POST", url: "contracts/legacy", data: dto });
  },
};

export default contractsApi;
