import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { User, UserWithCreator, CreateUserDto, UpdateUserDto } from "@/types/user";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";

export type UsersPrintFilters = {
  keyword?: string;
  departmentId?: string | null;
  roleId?: string | null;
};

const usersApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateUserDto }) {
    return await privateRequest<User>({ method: "POST", url: "users", data: dto });
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
    return await privateRequest<PaginatedData<User>>({ url: "users", params, signal });
  },

  async listAllToPrint({
    privateRequest,
    signal,
    filters = {},
  }: {
    privateRequest: PrivateRequest;
    signal?: AbortSignal;
    filters?: UsersPrintFilters;
  }) {
    const result = await privateRequest<PaginatedData<User>>({
      url: "users",
      params: {
        limit: Infinity,
        sort: "name",
        ...removeEmptyParams({
          keyword: filters.keyword,
          departmentId: filters.departmentId,
          roleId: filters.roleId,
        }),
      },
      signal,
    });

    return result.data;
  },

  async lookup({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<User>>({ url: "users/lookup", params, signal });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<UserWithCreator>({ url: `users/${id}`, signal });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateUserDto }) {
    return await privateRequest<User>({ method: "PUT", url: `users/${id}`, data: dto });
  },

  async delete({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<void>({ method: "DELETE", url: `users/${id}` });
  },
};

export default usersApi;
