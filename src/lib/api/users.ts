import type { PrivateRequest, Dictionary } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type { User, CreateUserDto, UpdateUserDto } from "@/types/user";

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

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<User>({ url: `users/${id}`, signal });
  },

  async update({ privateRequest, id, dto }: { privateRequest: PrivateRequest; id: string; dto: UpdateUserDto }) {
    return await privateRequest<User>({ method: "PUT", url: `users/${id}`, data: dto });
  },

  async delete({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<void>({ method: "DELETE", url: `users/${id}` });
  },
};

export default usersApi;
