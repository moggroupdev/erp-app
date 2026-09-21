import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  Material,
  MaterialUnitConversion,
  MaterialWithUnitConversions,
  MaterialWithCreatorAndUnitConversions,
  CreateMaterialDto,
  UpdateMaterialDto,
  CreateMaterialUnitConversionDto,
  SetMaterialMarketPriceDto,
  SetMaterialTypeDto,
  MaterialTypeChangeImpact,
} from "@/types/material";
import type { MaterialType } from "@/lib/constants/enums/material-types";

const materialsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateMaterialDto }) {
    return await privateRequest<Material>({ method: "POST", url: "materials", data: dto });
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
    return await privateRequest<PaginatedData<MaterialWithUnitConversions>>({ url: "materials", params, signal });
  },

  async listAllToPrint({
    privateRequest,
    signal,
    mainCategoryId,
  }: {
    privateRequest: PrivateRequest;
    signal?: AbortSignal;
    mainCategoryId?: string;
  }) {
    const result = await privateRequest<PaginatedData<MaterialWithUnitConversions>>({
      url: "materials",
      params: {
        limit: Infinity,
        sort: "title",
        ...(mainCategoryId ? { mainCategoryId } : {}),
      },
      signal,
    });

    return result.data;
  },

  async get({ privateRequest, code, signal }: { privateRequest: PrivateRequest; code: string; signal?: AbortSignal }) {
    return await privateRequest<MaterialWithCreatorAndUnitConversions>({ url: `materials/${code}`, signal });
  },

  async update({ privateRequest, code, dto }: { privateRequest: PrivateRequest; code: string; dto: UpdateMaterialDto }) {
    return await privateRequest<Material>({ method: "PUT", url: `materials/${code}`, data: dto });
  },

  async setMarketPrice({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: SetMaterialMarketPriceDto;
  }) {
    return await privateRequest<Material>({ method: "PATCH", url: `materials/${code}/market-price`, data: dto });
  },

  async previewTypeChange({
    privateRequest,
    code,
    targetType,
    signal,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    targetType: MaterialType;
    signal?: AbortSignal;
  }) {
    return await privateRequest<MaterialTypeChangeImpact>({
      url: `materials/${code}/material-type/impact`,
      params: { targetType },
      signal,
    });
  },

  async setType({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: SetMaterialTypeDto;
  }) {
    return await privateRequest<Material>({ method: "PATCH", url: `materials/${code}/material-type`, data: dto });
  },

  // ==================== UNITS ====================

  async addUnit({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: CreateMaterialUnitConversionDto;
  }) {
    return await privateRequest<MaterialUnitConversion>({ method: "POST", url: `materials/${code}/units`, data: dto });
  },
};

export default materialsApi;
