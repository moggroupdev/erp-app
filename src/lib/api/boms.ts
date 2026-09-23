import type { PrivateRequest } from "@/types/api";
import type {
  BomItem,
  Bom,
  BomMaterialUsage,
  CreateBomDto,
  CreateBomItemDto,
  UpdateBomItemDto,
  ReplaceDepartmentBomDto,
} from "@/types/bom";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";

const bomsApi = {
  async create({
    privateRequest,
    dimensionId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dimensionId: string;
    dto: CreateBomDto;
  }) {
    return await privateRequest<BomItem[]>({ method: "POST", url: `boms/${dimensionId}`, data: dto });
  },

  async getByDimension({
    privateRequest,
    dimensionId,
    signal,
  }: {
    privateRequest: PrivateRequest;
    dimensionId: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<Bom>({ url: `boms/${dimensionId}`, signal });
  },

  async listByMaterial({
    privateRequest,
    materialCode,
    signal,
  }: {
    privateRequest: PrivateRequest;
    materialCode: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<BomMaterialUsage[]>({ url: `boms/by-material/${materialCode}`, signal });
  },

  async appendItem({
    privateRequest,
    dimensionId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dimensionId: string;
    dto: CreateBomItemDto;
  }) {
    return await privateRequest<BomItem>({ method: "POST", url: `boms/${dimensionId}/append`, data: dto });
  },

  async replaceDepartment({
    privateRequest,
    dimensionId,
    productionSubDepartment,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dimensionId: string;
    productionSubDepartment: ProductionSubDepartment;
    dto: ReplaceDepartmentBomDto;
  }) {
    return await privateRequest<BomItem[]>({
      method: "PUT",
      url: `boms/${dimensionId}/department/${productionSubDepartment}`,
      data: dto,
    });
  },

  async updateItem({
    privateRequest,
    itemId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    itemId: string;
    dto: UpdateBomItemDto;
  }) {
    return await privateRequest<BomItem>({ method: "PATCH", url: `boms/${itemId}`, data: dto });
  },

  async deleteItem({ privateRequest, itemId }: { privateRequest: PrivateRequest; itemId: string }) {
    return await privateRequest<BomItem>({ method: "DELETE", url: `boms/${itemId}` });
  },

  async deleteAll({
    privateRequest,
    dimensionId,
  }: {
    privateRequest: PrivateRequest;
    dimensionId: string;
  }) {
    return await privateRequest<{ deletedCount: number }>({
      method: "DELETE",
      url: `boms/${dimensionId}/all`,
    });
  },
};

export default bomsApi;
