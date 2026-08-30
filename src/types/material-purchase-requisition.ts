import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
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

// =============== Material Purchase Requisitions ===============

export type MaterialPurchaseRequisition = {
  id: string;
  code: string;
  productionSubDepartment: ProductionSubDepartment;
  productionSubDepartmentManagerId: string | null;
  notes: string | null;
  planningApprovedAt: Date | null;
  planningApprovedBy: string | null;
  purchasingManagerApprovedAt: Date | null;
  purchasingManagerApprovedBy: string | null;
  directorApprovedAt: Date | null;
  directorApprovedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  createdBy: string;
};

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
  | "createdBy"
  | "productionSubDepartmentManagerId"
  | "planningApprovedBy"
  | "purchasingManagerApprovedBy"
  | "directorApprovedBy"
  | "rejectedBy"
> & {
  createdBy: UserRef;
  productionSubDepartmentManager: UserRef | null;
  planningApprovedBy: UserRef | null;
  purchasingManagerApprovedBy: UserRef | null;
  directorApprovedBy: UserRef | null;
  rejectedBy: UserRef | null;
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

export type UpdateMaterialPurchaseRequisitionDto = Partial<
  Omit<CreateMaterialPurchaseRequisitionDto, "items">
>;

export type UpdateMaterialPurchaseRequisitionItemDto = Partial<CreateMaterialPurchaseRequisitionItemDto>;

export type RejectMaterialPurchaseRequisitionDto = {
  rejectionReason: string;
};
