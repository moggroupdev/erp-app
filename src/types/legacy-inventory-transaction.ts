import type { LegacyWorkOrderType } from "@/lib/constants/enums/legacy-work-order-types";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";

export type LegacyInventoryTransaction = {
  id: string;
  issuePermitNumber: string;
  issueOrderNumber: string;
  date: Date;
  creatorId: string;
  productionSubDepartment: ProductionSubDepartment | null;
  contractNumber: string | null;
  workOrderNumber: string | null;
  workOrderNumberType: LegacyWorkOrderType;
  isCancelled: boolean;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type LegacyInventoryTransactionItem = {
  id: string;
  legacyTransactionId: string;
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantity: number;
  notes: string | null;
};

export type LegacyInventoryTransactionItemDetailed = LegacyInventoryTransactionItem & {
  material: {
    code: string;
    title: string;
    materialType: MaterialType;
    unitOfMeasurement: MaterialUnit;
    subCategoryId: string;
  };
};

export type LegacyInventoryTransactionDetailed = Omit<LegacyInventoryTransaction, "creatorId" | "createdBy"> & {
  creator: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: LegacyInventoryTransactionItemDetailed[];
};

// ==================== DTOs ====================

export type CreateLegacyInventoryTransactionItemDto = {
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantity: number;
  notes: string | null;
};

export type CreateLegacyInventoryTransactionDto = {
  issuePermitNumber: string;
  issueOrderNumber: string;
  date: string;
  creatorId: string;
  productionSubDepartment: ProductionSubDepartment | null;
  contractNumber: string | null;
  workOrderNumber: string | null;
  workOrderNumberType?: LegacyWorkOrderType;
  isCancelled?: boolean;
  notes: string | null;
  items: CreateLegacyInventoryTransactionItemDto[];
};

export type UpdateLegacyInventoryTransactionDto = Partial<Omit<CreateLegacyInventoryTransactionDto, "items">>;

export type UpdateLegacyInventoryTransactionItemDto = Partial<CreateLegacyInventoryTransactionItemDto>;
