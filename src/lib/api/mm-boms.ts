import type { PrivateRequest } from "@/types/api";
import type { MmBomItem, MmBom, CreateMmBomDto, CreateMmBomItemDto, UpdateMmBomItemDto } from "@/types/mm-bom";

const mmBomsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateMmBomDto }) {
    return await privateRequest<MmBomItem[]>({ method: "POST", url: "mm-boms", data: dto });
  },

  async getByMaterial({
    privateRequest,
    manufacturedMaterialCode,
    signal,
  }: {
    privateRequest: PrivateRequest;
    manufacturedMaterialCode: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<MmBom>({ url: `mm-boms/${manufacturedMaterialCode}`, signal });
  },

  async appendItem({
    privateRequest,
    manufacturedMaterialCode,
    dto,
  }: {
    privateRequest: PrivateRequest;
    manufacturedMaterialCode: string;
    dto: CreateMmBomItemDto;
  }) {
    return await privateRequest<MmBomItem>({
      method: "POST",
      url: `mm-boms/${manufacturedMaterialCode}/items`,
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
    dto: UpdateMmBomItemDto;
  }) {
    return await privateRequest<MmBomItem>({ method: "PATCH", url: `mm-boms/items/${itemId}`, data: dto });
  },
};

export default mmBomsApi;
