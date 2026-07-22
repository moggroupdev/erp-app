import type { PrivateRequest } from "@/types/api";
import type { BomItem, Bom, CreateBomDto, CreateBomItemDto, UpdateBomItemDto } from "@/types/bom";

const bomsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateBomDto }) {
    return await privateRequest<BomItem[]>({ method: "POST", url: "boms", data: dto });
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

  async appendItem({
    privateRequest,
    dimensionId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    dimensionId: string;
    dto: CreateBomItemDto;
  }) {
    return await privateRequest<BomItem>({ method: "POST", url: `boms/${dimensionId}/items`, data: dto });
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
    return await privateRequest<BomItem>({ method: "PATCH", url: `boms/items/${itemId}`, data: dto });
  },
};

export default bomsApi;
