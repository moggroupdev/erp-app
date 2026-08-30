import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { ApprovalDecision } from "@/lib/constants/enums/approval-decisions";
import type { MaterialUnitConversionSummary } from "@/types/material";

type UserRef = { id: string; name: string };

type RequisitionMaterial = {
  code: string;
  title: string;
  materialType: MaterialType;
  unitOfMeasurement: MaterialUnit;
  subCategoryId: string;
  unitConversions: MaterialUnitConversionSummary[];
};

type ApprovalGateFields<P extends string> = {
  [K in `${P}Decision`]: ApprovalDecision;
} & {
  [K in `${P}DecidedAt`]: Date | null;
} & {
  [K in `${P}DecidedBy`]: string | null;
} & {
  [K in `${P}DecisionReason`]: string | null;
};

// =============== Material Purchase Requisitions ===============

export type MaterialPurchaseRequisition = {
  id: string;
  code: string;
  productionSubDepartment: ProductionSubDepartment;
  productionSubDepartmentManagerId: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
} & ApprovalGateFields<"planning"> &
  ApprovalGateFields<"purchasingManager"> &
  ApprovalGateFields<"manager">;

export type MaterialPurchaseRequisitionListItem = Omit<
  MaterialPurchaseRequisition,
  "createdBy" | "productionSubDepartmentManagerId"
> & {
  createdBy: UserRef;
  productionSubDepartmentManager: UserRef | null;
};

export type MaterialPurchaseRequisitionItem = {
  id: string;
  materialPurchaseRequisitionId: string;
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityRequested: number;
  notes: string | null;
};

export type MaterialPurchaseRequisitionItemDetailed = MaterialPurchaseRequisitionItem & {
  material: RequisitionMaterial;
  quantityAllocated: number;
  quantityRemaining: number;
};

export type MaterialPurchaseRequisitionDetailed = Omit<
  MaterialPurchaseRequisition,
  "createdBy" | "productionSubDepartmentManagerId" | "planningDecidedBy" | "purchasingManagerDecidedBy" | "managerDecidedBy"
> & {
  createdBy: UserRef;
  productionSubDepartmentManager: UserRef | null;
  planningDecidedBy: UserRef | null;
  purchasingManagerDecidedBy: UserRef | null;
  managerDecidedBy: UserRef | null;
  items: MaterialPurchaseRequisitionItemDetailed[];
};

// ==================== DTOs ====================

export type CreateMaterialPurchaseRequisitionItemDto = {
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityRequested: number;
  notes: string | null;
};

export type CreateMaterialPurchaseRequisitionDto = {
  productionSubDepartment: ProductionSubDepartment;
  notes: string | null;
  items: CreateMaterialPurchaseRequisitionItemDto[];
};

export type UpdateMaterialPurchaseRequisitionDto = Partial<Omit<CreateMaterialPurchaseRequisitionDto, "items">>;

export type UpdateMaterialPurchaseRequisitionItemDto = Partial<CreateMaterialPurchaseRequisitionItemDto>;

export type RejectMaterialPurchaseRequisitionDto = {
  reason: string;
};
