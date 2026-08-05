import type { InventoryTransactionType } from "@/lib/constants/enums/inventory-transaction-types";
import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";

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
  productionPlanItemId: string | null;
  maintenanceOrderSparePartId: string | null;
  outsourcingOrderItemId: string | null;
  outsourcingReceiptItemId: string | null;
  materialPurchaseReceiptItemId: string | null;
  material: {
    code: string;
    title: string;
    materialType: MaterialType;
    unitOfMeasurement: MaterialUnit;
    subCategoryId: string;
    unitPrice: number;
  };
};

export type InventoryTransactionDetailed = InventoryTransactionWithCreator & {
  items: InventoryTransactionItem[];
};
