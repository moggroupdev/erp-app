import authApi from "@/lib/api/auth";

export default function useRefresh() {
  return async () => {
    try {
      return await authApi.refreshAccessToken();
    } catch (error) {
      throw error;
    }
  };
}
