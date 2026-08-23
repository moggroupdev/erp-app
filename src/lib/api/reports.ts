import type { PrivateRequest } from "@/types/api";
import type {
  MaterialsCategoryStats,
  MaterialsInventorySummary,
  PurchasingMaterialsCategoryStats,
  PurchasingMaterialsSpendingSummary,
  PurchasingMaterialsPriceHistory,
} from "@/types/reports";

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

  purchasingMaterials: {
    async getSpendingSummary({
      privateRequest,
      from,
      to,
      groupBy,
      signal,
    }: {
      privateRequest: PrivateRequest;
      from?: string;
      to?: string;
      groupBy?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsSpendingSummary>({
        url: "reports/purchasing-materials/spending-summary",
        params: { from, to, groupBy },
        signal,
      });
    },

    async getPriceHistory({
      privateRequest,
      materialCode,
      from,
      to,
      signal,
    }: {
      privateRequest: PrivateRequest;
      materialCode: string;
      from?: string;
      to?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsPriceHistory>({
        url: "reports/purchasing-materials/price-history",
        params: { materialCode, from, to },
        signal,
      });
    },

    async getCategoryStats({
      privateRequest,
      mainCategoryId,
      from,
      to,
      signal,
    }: {
      privateRequest: PrivateRequest;
      mainCategoryId: string;
      from?: string;
      to?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsCategoryStats>({
        url: "reports/purchasing-materials/category-stats",
        params: { mainCategoryId, from, to },
        signal,
      });
    },
  },
};

export default reportsApi;
