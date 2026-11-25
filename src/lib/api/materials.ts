import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  Material,
  MaterialUnitConversion,
  MaterialWithUnitConversions,
  MaterialWithCreatorAndUnitConversions,
  MaterialLastPurchasePrice,
  DeletedMaterial,
  CreateMaterialDto,
  UpdateMaterialDto,
  CreateMaterialUnitConversionDto,
  UpdateMaterialUnitConversionDto,
  SetMaterialMarketPriceDto,
  SetMaterialMarketManufacturingCostDto,
  SetMaterialTypeDto,
  MaterialTypeChangeImpact,
  MaterialDeleteImpact,
  DeleteMaterialDto,
  MaterialMergePreview,
  MergeMaterialDto,
} from "@/types/material";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";

export type MaterialsPrintFilters = {
  keyword?: string;
  materialType?: string | null;
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
};

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

  async listDeleted({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<DeletedMaterial>>({ url: "materials/deleted", params, signal });
  },

  async listAllToPrint({
    privateRequest,
    signal,
    filters = {},
  }: {
    privateRequest: PrivateRequest;
    signal?: AbortSignal;
    filters?: MaterialsPrintFilters;
  }) {
    const result = await privateRequest<PaginatedData<MaterialWithUnitConversions>>({
      url: "materials",
      params: {
        limit: Infinity,
        sort: "title",
        ...removeEmptyParams({
          keyword: filters.keyword,
          materialType: filters.materialType,
          mainCategoryId: filters.mainCategoryId,
          subCategoryId: filters.subCategoryId,
        }),
      },
      signal,
    });

    return result.data;
  },

  async get({ privateRequest, code, signal }: { privateRequest: PrivateRequest; code: string; signal?: AbortSignal }) {
    return await privateRequest<MaterialWithCreatorAndUnitConversions>({ url: `materials/${code}`, signal });
  },

  async getLastPurchasePrice({
    privateRequest,
    code,
    signal,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<MaterialLastPurchasePrice>({ url: `materials/${code}/last-purchase-price`, signal });
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

  async setMarketManufacturingCost({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: SetMaterialMarketManufacturingCostDto;
  }) {
    return await privateRequest<Material>({
      method: "PATCH",
      url: `materials/${code}/market-manufacturing-cost`,
      data: dto,
    });
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

  async getDeleteImpact({
    privateRequest,
    code,
    signal,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<MaterialDeleteImpact>({
      url: `materials/${code}/delete-impact`,
      signal,
    });
  },

  async delete({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: DeleteMaterialDto;
  }) {
    return await privateRequest<void>({ method: "DELETE", url: `materials/${code}`, data: dto });
  },

  async restore({ privateRequest, code }: { privateRequest: PrivateRequest; code: string }) {
    return await privateRequest<Material>({ method: "PATCH", url: `materials/${code}/restore` });
  },

  async previewMerge({
    privateRequest,
    code,
    removeCode,
    signal,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    removeCode: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<MaterialMergePreview>({
      url: `materials/${code}/merge-preview`,
      params: { removeCode },
      signal,
    });
  },

  async merge({
    privateRequest,
    code,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    dto: MergeMaterialDto;
  }) {
    return await privateRequest<Material>({ method: "POST", url: `materials/${code}/merge`, data: dto });
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

  async updateUnit({
    privateRequest,
    code,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    code: string;
    id: string;
    dto: UpdateMaterialUnitConversionDto;
  }) {
    return await privateRequest<MaterialUnitConversion>({
      method: "PATCH",
      url: `materials/${code}/units/${id}`,
      data: dto,
    });
  },
};

export default materialsApi;
