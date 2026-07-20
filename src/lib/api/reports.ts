import type { PrivateRequest } from "@/types/api";
import type { MaterialsCategoryStats, MaterialsInventorySummary } from "@/types/reports";

const reportsApi = {
  materials: {
    async getInventorySummary({
      privateRequest,
      signal,
    }: {
      privateRequest: PrivateRequest;
      signal?: AbortSignal;
    }) {
      return await privateRequest<MaterialsInventorySummary>({
        url: "reports/materials/inventory-summary",
        signal,
      });
    },

    async getCategoryStats({
      privateRequest,
      mainCategoryId,
      signal,
    }: {
      privateRequest: PrivateRequest;
      mainCategoryId: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<MaterialsCategoryStats>({
        url: "reports/materials/category-stats",
        params: { mainCategoryId },
        signal,
      });
    },
  },
};

export default reportsApi;
