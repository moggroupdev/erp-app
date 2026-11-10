import type { PrivateRequest } from "@/types/api";
import type {
  MaterialsCategoryStats,
  MaterialsInventorySummary,
  MaterialsIssuePermitHistory,
  LegacyIssuePermitSummary,
  PurchasingMaterialsCategoryStats,
  PurchasingMaterialsSpendingSummary,
  PurchasingMaterialsPriceHistory,
  PurchasingMaterialsSubCategoryStats,
  PurchasingMaterialsSupplierStats,
  PurchasingMaterialsSupplierComparison,
  PurchasingMaterialsTotalAmountMismatches,
  PurchasingMaterialsRequisitionFollowUp,
  PurchasingMaterialsRequisitionHistory,
  PurchasingMaterialsPriceOutliers,
  PurchasingMaterialsAveragePriceGaps,
} from "@/types/reports";

const reportsApi = {
  materials: {
    async getInventorySummary({ privateRequest, signal }: { privateRequest: PrivateRequest; signal?: AbortSignal }) {
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

    async getLegacyIssuePermitSummary({
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
      return await privateRequest<LegacyIssuePermitSummary>({
        url: "reports/materials/legacy-issue-permit-summary",
        params: { from, to },
        signal,
      });
    },

    async getIssuePermitHistory({
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
      return await privateRequest<MaterialsIssuePermitHistory>({
        url: "reports/materials/issue-permit-history",
        params: { materialCode, from, to },
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

    async getSupplierComparison({
      privateRequest,
      supplierAId,
      supplierBId,
      from,
      to,
      signal,
    }: {
      privateRequest: PrivateRequest;
      supplierAId: string;
      supplierBId: string;
      from?: string;
      to?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsSupplierComparison>({
        url: "reports/purchasing-materials/supplier-comparison",
        params: { supplierAId, supplierBId, from, to },
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

    async getPriceOutliers({
      privateRequest,
      from,
      to,
      threshold,
      signal,
    }: {
      privateRequest: PrivateRequest;
      from?: string;
      to?: string;
      threshold?: number;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsPriceOutliers>({
        url: "reports/purchasing-materials/price-outliers",
        params: { from, to, threshold },
        signal,
      });
    },

    async getAveragePriceGaps({
      privateRequest,
      from,
      to,
      threshold,
      signal,
    }: {
      privateRequest: PrivateRequest;
      from?: string;
      to?: string;
      threshold?: number;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsAveragePriceGaps>({
        url: "reports/purchasing-materials/average-price-gaps",
        params: { from, to, threshold },
        signal,
      });
    },

    async getRequisitionFollowUp({
      privateRequest,
      productionSubDepartment,
      from,
      to,
      signal,
    }: {
      privateRequest: PrivateRequest;
      productionSubDepartment: string;
      from?: string;
      to?: string;
      signal?: AbortSignal;
    }) {
      return await privateRequest<PurchasingMaterialsRequisitionFollowUp>({
        url: "reports/purchasing-materials/requisition-follow-up",
        params: { productionSubDepartment, from, to },
        signal,
      });
    },

    async getRequisitionHistory({
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
      return await privateRequest<PurchasingMaterialsRequisitionHistory>({
        url: "reports/purchasing-materials/requisition-history",
        params: { materialCode, from, to },
        signal,
      });
    },
  },
};

export default reportsApi;
