import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { Material, MaterialWithCreator, CreateMaterialDto, UpdateMaterialDto } from "@/types/material";

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
    return await privateRequest<PaginatedData<Material>>({ url: "materials", params, signal });
  },

  async get({ privateRequest, code, signal }: { privateRequest: PrivateRequest; code: string; signal?: AbortSignal }) {
    return await privateRequest<MaterialWithCreator>({ url: `materials/${code}`, signal });
  },

  async update({ privateRequest, code, dto }: { privateRequest: PrivateRequest; code: string; dto: UpdateMaterialDto }) {
    return await privateRequest<Material>({ method: "PUT", url: `materials/${code}`, data: dto });
  },
};

export default materialsApi;
