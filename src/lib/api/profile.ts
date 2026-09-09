import type { PrivateRequest } from "@/types/api";
import type { UserWithCreator, UpdatePasswordDto } from "@/types/user";

const profileApi = {
  async get({ privateRequest, signal }: { privateRequest: PrivateRequest; signal?: AbortSignal }) {
    return await privateRequest<UserWithCreator>({ url: "profile", signal });
  },

  async updatePassword({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: UpdatePasswordDto }) {
    return await privateRequest<{ message: string }>({ method: "PUT", url: "profile/password", data: dto });
  },
};

export default profileApi;
