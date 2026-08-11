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
} from "@/types/material";

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

  // ==================== UNITS ====================

  async listUnits({ privateRequest, code, signal }: { privateRequest: PrivateRequest; code: string; signal?: AbortSignal }) {
    return await privateRequest<MaterialUnitConversion[]>({ url: `materials/${code}/units`, signal });
  },

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

  async removeUnit({ privateRequest, code, id }: { privateRequest: PrivateRequest; code: string; id: string }) {
    return await privateRequest<MaterialUnitConversion>({ method: "DELETE", url: `materials/${code}/units/${id}` });
  },
};

export default materialsApi;
