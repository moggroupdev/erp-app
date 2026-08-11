import type { InventoryTransactionType } from "@/lib/constants/enums/inventory-transaction-types";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary } from "@/types/material";

export type InventoryTransaction = {
  id: string;
  code: string;
  legacyNumber: string | null;
  transactionType: InventoryTransactionType;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type InventoryTransactionWithCreator = Omit<InventoryTransaction, "createdBy"> & {
  createdBy: { id: string; name: string };
};

export type InventoryTransactionItem = {
  id: string;
  transactionId: string;
  materialCode: string;
  quantity: number;
  unitPrice: number;
  material: {
    code: string;
    title: string;
    materialType: MaterialType;
    unitOfMeasurement: MaterialUnit;
    subCategoryId: string;
    unitPrice: number;
    unitConversions: MaterialUnitConversionSummary[];
  };
};

export type InventoryTransactionSource = {
  materialPurchaseReceipt: {
    id: string;
    code: string;
    materialPurchaseOrder: { id: string; legacyInvoiceNumber: string | null };
  } | null;
  outsourcingReceipt: {
    id: string;
    code: string;
    outsourcingOrder: { id: string; code: string };
  } | null;
  productionPlanItem: {
    id: string;
    productionStage: ProductionSubDepartment;
    productUnit: {
      id: string;
      serialNumber: string;
      contractItem: {
        id: string;
        contract: { id: string; code: string; customer: { id: string; name: string } };
      };
    };
  } | null;
  outsourcingOrder: { id: string; code: string } | null;
  maintenanceOrder: { id: string; code: string } | null;
};

export type InventoryTransactionDetailed = InventoryTransactionWithCreator &
  InventoryTransactionSource & { items: InventoryTransactionItem[] };
