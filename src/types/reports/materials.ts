import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { StockStatus } from "@/lib/constants/enums/derived/stock-statuses";
import type { LegacyIssuePermitMaintenanceOrderType } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";
import type { LegacyIssuePermitType } from "@/lib/constants/enums/legacy-issue-permit-types";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary } from "@/types/material";

export type MaterialsInventoryOverview = {
  totalMaterials: number;
  totalInventoryValue: number;
  totalOpeningValue: number;
  valueChangeAmount: number;
  valueChangePercentage: number;
  outOfStockCount: number;
  lowStockCount: number;
  noMinimumStockCount: number;
};

export type MaterialsInventoryByMaterialType = {
  materialType: MaterialType;
  count: number;
  totalQuantity: number;
  totalValue: number;
};

export type MaterialsInventoryByMainCategory = {
  mainCategoryId: string;
  mainCategoryTitle: string;
  count: number;
  totalValue: number;
};

export type MaterialsCategoryStatsBySubCategory = {
  subCategoryId: string;
  subCategoryTitle: string;
  count: number;
  totalValue: number;
};

export type MaterialsInventoryStockStatus = {
  status: StockStatus;
  count: number;
  totalValue: number;
};

export type MaterialsInventoryTopMaterial = {
  code: string;
  title: string;
  unitOfMeasurement: MaterialUnit;
  quantity: number;
  unitPrice: number;
  value: number;
};

export type MaterialsInventoryLowStockMaterial = {
  code: string;
  title: string;
  quantity: number;
  minimumStock: number;
  deficit: number;
};

export type MaterialsInventorySummary = {
  overview: MaterialsInventoryOverview;
  byMaterialType: MaterialsInventoryByMaterialType[];
  byMainCategory: MaterialsInventoryByMainCategory[];
  stockStatus: MaterialsInventoryStockStatus[];
  topMaterialsByValue: MaterialsInventoryTopMaterial[];
  topMaterialsByQuantity: MaterialsInventoryTopMaterial[];
  lowStockMaterials: MaterialsInventoryLowStockMaterial[];
};

export type MaterialsCategoryStats = {
  category: { id: string; title: string };
  overview: MaterialsInventoryOverview;
  byMaterialType: MaterialsInventoryByMaterialType[];
  stockStatus: MaterialsInventoryStockStatus[];
  bySubCategory: MaterialsCategoryStatsBySubCategory[];
  topMaterialsByValue: MaterialsInventoryTopMaterial[];
  topMaterialsByQuantity: MaterialsInventoryTopMaterial[];
  lowStockMaterials: MaterialsInventoryLowStockMaterial[];
};

// ================ Legacy Issue Permit Summary ================

export type LegacyIssuePermitSummaryOverview = {
  permitCount: number;
  activePermitCount: number;
  cancelledPermitCount: number;
  itemCount: number;
  materialLineCount: number;
  noteOnlyLineCount: number;
  emptyPermitCount: number;
  permitsWithIssueOrder: number;
  multipleCustomerPermitCount: number;
  distinctMaterialCount: number;
  distinctCustomerCount: number;
  distinctCreatorCount: number;
  minDate: string | null;
  maxDate: string | null;
  headerNoteCount: number;
  lineNoteCount: number;
};

export type LegacyIssuePermitSummaryByPermitType = {
  permitType: LegacyIssuePermitType;
  permitCount: number;
  cancelledCount: number;
  itemCount: number;
  headerNoteCount: number;
};

export type LegacyIssuePermitSummaryByProductionSubDepartment = {
  productionSubDepartment: ProductionSubDepartment | null;
  permitCount: number;
  cancelledCount: number;
  itemCount: number;
  headerNoteCount: number;
};

export type LegacyIssuePermitSummaryByMaintenanceOrderType = {
  maintenanceOrderType: LegacyIssuePermitMaintenanceOrderType | null;
  permitCount: number;
  cancelledCount: number;
  itemCount: number;
  headerNoteCount: number;
};

export type LegacyIssuePermitSummaryByMonth = {
  month: string;
  permitCount: number;
  cancelledCount: number;
  itemCount: number;
};

export type LegacyIssuePermitSummaryTopMaterial = {
  materialCode: string;
  materialTitle: string;
  unitOfMeasurement: MaterialUnit;
  unitConversions: MaterialUnitConversionSummary[];
  lineCount: number;
  issuedQuantityInBase: number;
  cancelledQuantityInBase: number;
  missingConversionCount: number;
};

export type LegacyIssuePermitSummaryTopCustomer = {
  customerId: string;
  customerName: string;
  permitCount: number;
};

export type LegacyIssuePermitSummaryTopCreator = {
  creatorId: string;
  creatorName: string;
  permitCount: number;
};

export type LegacyIssuePermitSummaryDataQualityCode =
  | "contract_review_missing_contract_number"
  | "maintenance_order_missing_order_number"
  | "maintenance_order_missing_order_type"
  | "customer_scoped_missing_customer"
  | "material_lines_missing_conversion";

export type LegacyIssuePermitSummaryDataQualityNote = {
  code: LegacyIssuePermitSummaryDataQualityCode;
  count: number;
  caption: { en: string; ar: string };
};

export type LegacyIssuePermitSummaryHeaderNote = {
  id: string;
  issuePermitNumber: string;
  date: string;
  permitType: LegacyIssuePermitType;
  notes: string;
};

export type LegacyIssuePermitSummaryLineNote = {
  itemId: string;
  issuePermitId: string;
  issuePermitNumber: string;
  date: string;
  materialCode: string | null;
  notes: string;
};

export type LegacyIssuePermitSummary = {
  overview: LegacyIssuePermitSummaryOverview;
  byPermitType: LegacyIssuePermitSummaryByPermitType[];
  byProductionSubDepartment: LegacyIssuePermitSummaryByProductionSubDepartment[];
  byMaintenanceOrderType: LegacyIssuePermitSummaryByMaintenanceOrderType[];
  byMonth: LegacyIssuePermitSummaryByMonth[];
  topMaterials: LegacyIssuePermitSummaryTopMaterial[];
  topCustomers: LegacyIssuePermitSummaryTopCustomer[];
  topCreators: LegacyIssuePermitSummaryTopCreator[];
  dataQuality: LegacyIssuePermitSummaryDataQualityNote[];
  headerNotes: LegacyIssuePermitSummaryHeaderNote[];
  lineNotes: LegacyIssuePermitSummaryLineNote[];
};

// ================ Issue Permit History ================

export type MaterialsIssuePermitHistoryStatus = "issued" | "cancelled";

export type MaterialsIssuePermitHistoryEntry = {
  issuePermitItemId: string;
  issuePermitId: string;
  issuePermitNumber: string;
  date: string;
  productionSubDepartment: ProductionSubDepartment | null;
  creatorId: string;
  creatorName: string;
  permitType: LegacyIssuePermitType;
  contractNumber: string | null;
  maintenanceOrderNumber: string | null;
  maintenanceOrderType: LegacyIssuePermitMaintenanceOrderType | null;
  hasMultipleCustomers: boolean;
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | null;
  quantityInBase: number | null;
  isCancelled: boolean;
  status: MaterialsIssuePermitHistoryStatus;
  notes: string | null;
};

export type MaterialsIssuePermitHistorySummary = {
  lineCount: number;
  permitCount: number;
  issuedQuantity: number;
  cancelledQuantity: number;
  missingConversionCount: number;
};

export type MaterialsIssuePermitHistory = {
  material: {
    code: string;
    title: string;
    unitOfMeasurement: MaterialUnit;
    unitConversions: MaterialUnitConversionSummary[];
  };
  entries: MaterialsIssuePermitHistoryEntry[];
  summary: MaterialsIssuePermitHistorySummary;
};
