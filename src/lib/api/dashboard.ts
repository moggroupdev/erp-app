import type { PrivateRequest } from "@/types/api";
import type { DashboardQuickStats } from "@/types/reports";

const dashboardApi = {
  async getQuickStats({
    privateRequest,
    signal,
  }: {
    privateRequest: PrivateRequest;
    signal?: AbortSignal;
  }) {
    return await privateRequest<DashboardQuickStats>({
      url: "dashboard/quick-stats",
      signal,
    });
  },
};

export default dashboardApi;
