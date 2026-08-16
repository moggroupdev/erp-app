import type { LegacyIssuePermitWorkOrderType } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";

export type LegacyIssuePermit = {
  id: string;
  issuePermitNumber: string;
  issueOrderNumber: string;
  issueOrderDate: Date;
  date: Date;
  creatorId: string;
  productionSubDepartment: ProductionSubDepartment | null;
  contractNumber: string | null;
  workOrderNumber: string | null;
  workOrderNumberType: LegacyIssuePermitWorkOrderType;
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

export type LegacyIssuePermitDetailed = Omit<LegacyIssuePermit, "creatorId" | "createdBy"> & {
  creator: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: LegacyIssuePermitItemDetailed[];
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
  issueOrderNumber: string;
  issueOrderDate: string;
  date: string;
  creatorId: string;
  productionSubDepartment: ProductionSubDepartment | null;
  contractNumber: string | null;
  workOrderNumber: string | null;
  workOrderNumberType?: LegacyIssuePermitWorkOrderType;
  isCancelled?: boolean;
  notes: string | null;
  items: CreateLegacyIssuePermitItemDto[];
};

export type UpdateLegacyIssuePermitDto = Partial<Omit<CreateLegacyIssuePermitDto, "items">>;

export type UpdateLegacyIssuePermitItemDto = Partial<CreateLegacyIssuePermitItemDto>;

export type ReorderLegacyIssuePermitItemsDto = {
  itemIds: string[];
};
