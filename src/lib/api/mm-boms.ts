import type { PrivateRequest } from "@/types/api";
import type { MmBomItem, MmBom, CreateMmBomItemDto, UpdateMmBomItemDto } from "@/types/mm-bom";

const mmBomsApi = {
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
      url: `mm-boms/${manufacturedMaterialCode}/append`,
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
    return await privateRequest<MmBomItem>({ method: "PATCH", url: `mm-boms/${itemId}`, data: dto });
  },
};

export default mmBomsApi;
