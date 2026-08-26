import type { PrivateRequest } from "@/types/api";
import type {
  MaterialsCategoryStats,
  MaterialsInventorySummary,
  PurchasingMaterialsCategoryStats,
  PurchasingMaterialsSpendingSummary,
  PurchasingMaterialsPriceHistory,
  PurchasingMaterialsSubCategoryStats,
  PurchasingMaterialsSupplierStats,
  PurchasingMaterialsTotalAmountMismatches,
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

    async getSubCategoryStats({
      privateRequest,
      subCategoryId,
      from,
      to,
      signal,
    }: {
      privateRequest: PrivateRequest;
      subCategoryId: string;
      from?: string;
      to?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsSubCategoryStats>({
        url: "reports/purchasing-materials/subcategory-stats",
        params: { subCategoryId, from, to },
        signal,
      });
    },

    async getSupplierStats({
      privateRequest,
      supplierId,
      from,
      to,
      groupBy,
      signal,
    }: {
      privateRequest: PrivateRequest;
      supplierId: string;
      from?: string;
      to?: string;
      groupBy?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsSupplierStats>({
        url: "reports/purchasing-materials/supplier-stats",
        params: { supplierId, from, to, groupBy },
        signal,
      });
    },

    async getTotalAmountMismatches({
      privateRequest,
      from,
      to,
      signal,
    }: {
      privateRequest: PrivateRequest;
      from?: string;
      to?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsTotalAmountMismatches>({
        url: "reports/purchasing-materials/total-amount-mismatches",
        params: { from, to },
        signal,
      });
    },
  },
};

export default reportsApi;
