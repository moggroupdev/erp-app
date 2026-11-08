import type { LegacyIssuePermitMaintenanceOrderType } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";
import type { LegacyIssuePermitType } from "@/lib/constants/enums/legacy-issue-permit-types";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";

export type LegacyIssuePermit = {
  id: string;
  issuePermitNumber: string;
  issueOrderNumber: string | null;
  issueOrderDate: Date | null;
  date: Date;
  creatorId: string;
  productionSubDepartment: ProductionSubDepartment | null;
  permitType: LegacyIssuePermitType;
  contractNumber: string | null;
  maintenanceOrderNumber: string | null;
  maintenanceOrderType: LegacyIssuePermitMaintenanceOrderType | null;
  customerId: string | null;
  hasMultipleCustomers: boolean;
  isCancelled: boolean;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type LegacyIssuePermitItem = {
  id: string;
  issuePermitId: string;
  sequenceOrder: number;
  materialCode: string | null;
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | null;
  notes: string | null;
};

export type LegacyIssuePermitItemDetailed = LegacyIssuePermitItem & {
  material: {
    code: string;
    title: string;
    materialType: MaterialType;
    unitOfMeasurement: MaterialUnit;
    subCategoryId: string;
  } | null;
};

export type LegacyIssuePermitDetailed = Omit<LegacyIssuePermit, "creatorId" | "createdBy" | "customerId"> & {
  creator: { id: string; name: string };
  createdBy: { id: string; name: string };
  customer: { id: string; code: string; name: string } | null;
  items: LegacyIssuePermitItemDetailed[];
};

export type LegacyIssuePermitNeighbor = {
  id: string;
  issuePermitNumber: string;
};

export type LegacyIssuePermitNeighbors = {
  previous: LegacyIssuePermitNeighbor | null;
  next: LegacyIssuePermitNeighbor | null;
};

// ==================== DTOs ====================

export type CreateLegacyIssuePermitItemDto = {
  materialCode: string | null;
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | null;
  notes: string | null;
};

export type CreateLegacyIssuePermitDto = {
  issuePermitNumber: string;
  issueOrderNumber: string | null;
  issueOrderDate: string | null;
  date: string;
  creatorId: string;
  productionSubDepartment: ProductionSubDepartment | null;
  permitType: LegacyIssuePermitType;
  contractNumber: string | null;
  maintenanceOrderNumber: string | null;
  maintenanceOrderType: LegacyIssuePermitMaintenanceOrderType | null;
  customerId: string | null;
  hasMultipleCustomers?: boolean;
  isCancelled?: boolean;
  notes: string | null;
  items: CreateLegacyIssuePermitItemDto[];
};

export type UpdateLegacyIssuePermitDto = Partial<Omit<CreateLegacyIssuePermitDto, "items">>;

export type UpdateLegacyIssuePermitItemDto = Partial<CreateLegacyIssuePermitItemDto>;

export type ReorderLegacyIssuePermitItemsDto = {
  itemIds: string[];
};
