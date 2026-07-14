import type { PrivateRequest, Dictionary } from "@/types/api";
import type { Role, RoleWithPermissions, CreateRoleDto, UpdateRoleDto } from "@/types/roles";

const rolesApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateRoleDto }) {
    return await privateRequest<RoleWithPermissions>({ method: "POST", url: "roles", data: dto });
  },

  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params?: Dictionary;
    signal?: AbortSignal;
  }) {
    return await privateRequest<Role[]>({ url: "roles", params, signal });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<RoleWithPermissions>({ url: `roles/${id}`, signal });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateRoleDto }) {
    return await privateRequest<RoleWithPermissions>({ method: "PUT", url: `roles/${id}`, data: dto });
  },
};

export default rolesApi;
