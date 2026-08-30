import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";

type PurchaseMaterial = {
  code: string;
  title: string;
  materialType: MaterialType;
  unitOfMeasurement: MaterialUnit;
  subCategoryId: string;
};

type PurchaseMaterialWithUnitConversion = PurchaseMaterial & {
  unitConversions: MaterialUnitConversionSummary[];
};

// =============== Material Purchase Orders ===============

export type MaterialPurchaseOrder = {
  id: string;
  code: string;
  invoiceNumber: string | null;
  invoiceIssuedAt: Date | null;
  invoiceTotalPurchases: number | null;
  supplierId: string;
  totalAmount: number;
  completedAt: Date | null;
  cancelledAt: Date | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type MaterialPurchaseOrderWithSupplier = MaterialPurchaseOrder & {
  supplier: { id: string; name: string };
};

export type MaterialPurchaseOrderItem = {
  id: string;
  materialPurchaseOrderId: string;
  materialCode: string;
  quantityOrdered: number;
  unitPrice: number;
  notes: string | null;
  material: PurchaseMaterialWithUnitConversion;
};

export type MaterialPurchaseOrderDetailed = Omit<MaterialPurchaseOrder, "createdBy"> & {
  supplier: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: MaterialPurchaseOrderItem[];
};

// =============== Material Purchase Receipts ===============

export type MaterialPurchaseReceipt = {
  id: string;
  code: string;
  materialPurchaseOrderId: string;
  receivedAt: Date | null;
  receivedBy: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type MaterialPurchaseReceiptItem = {
  id: string;
  materialPurchaseReceiptId: string;
  materialPurchaseOrderItemId: string;
  quantityReceived: number;
  quantityRejected: number;
  inspectionNotes: string | null;
  materialPurchaseOrderItem: {
    id: string;
    materialCode: string;
    quantityOrdered: number;
    unitPrice: number;
    material: PurchaseMaterialWithUnitConversion;
  };
};

export type MaterialPurchaseReceiptDetailed = Omit<MaterialPurchaseReceipt, "createdBy" | "receivedBy"> & {
  materialPurchaseOrder: { id: string; invoiceNumber: string | null };
  inventoryTransactions: { id: string; legacyNumber: string | null }[];
  createdBy: { id: string; name: string };
  receivedBy: { id: string; name: string } | null;
  items: MaterialPurchaseReceiptItem[];
};
