import apiRequest from "@/lib/helpers/api-request";
import type { PrivateRequest } from "@/types/api";
import type { LoginDto, User, AuthenticationResponse } from "@/types/user";

const authApi = {
  async login({ dto }: { dto: LoginDto }) {
    return await apiRequest<AuthenticationResponse>({
      method: "POST",
      url: "auth/login",
      credentials: "include",
      data: dto,
    });
  },

  async logout(): Promise<void> {
    return await apiRequest<void>({ method: "POST", url: "auth/logout", credentials: "include" });
  },

  async refreshAccessToken() {
    return await apiRequest<AuthenticationResponse>({
      method: "POST",
      url: "auth/refresh-access-token",
      credentials: "include",
    });
  },

  async getProfile({ privateRequest }: { privateRequest: PrivateRequest }) {
    return await privateRequest<User>({ url: "auth/profile" });
  },
};

export default authApi;
