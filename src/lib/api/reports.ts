import type { PrivateRequest } from "@/types/api";
import type { MaterialsInventorySummary } from "@/types/reports";

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
  },
};

export default reportsApi;
