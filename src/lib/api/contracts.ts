import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  ContractDetailed,
  ContractListItem,
  CreatedLegacyContract,
  CreateLegacyContractDto,
  UpdateLegacyContractDto,
  ValidateLegacyContractDto,
  ValidateLegacyContractItemsDto,
  ValidateLegacyContractUnitsDto,
  ValidateUpdateLegacyContractUnitsDto,
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
    const { contractId, ...body } = dto;
    const url = contractId
      ? `contracts/legacy/${contractId}/validate-contract`
      : "contracts/legacy/validate-contract";
    return await privateRequest<{ ok: true }>({ method: "POST", url, data: body });
  },

  async validateLegacyItems({
    privateRequest,
    dto,
    contractId,
  }: {
    privateRequest: PrivateRequest;
    dto: ValidateLegacyContractItemsDto;
    contractId?: string;
  }) {
    const url = contractId
      ? `contracts/legacy/${contractId}/validate-items`
      : "contracts/legacy/validate-items";
    return await privateRequest<{ ok: true }>({ method: "POST", url, data: dto });
  },

  async validateLegacyUnits({
    privateRequest,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dto: ValidateLegacyContractUnitsDto | ValidateUpdateLegacyContractUnitsDto;
  }) {
    const { contractId, ...body } = dto;
    const url = contractId
      ? `contracts/legacy/${contractId}/validate-units`
      : "contracts/legacy/validate-units";
    return await privateRequest<{ ok: true }>({ method: "POST", url, data: body });
  },

  async createLegacy({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateLegacyContractDto }) {
    return await privateRequest<CreatedLegacyContract>({ method: "POST", url: "contracts/legacy", data: dto });
  },

  async updateLegacy({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: UpdateLegacyContractDto;
  }) {
    return await privateRequest<CreatedLegacyContract>({ method: "PATCH", url: `contracts/legacy/${id}`, data: dto });
  },
};

export default contractsApi;
