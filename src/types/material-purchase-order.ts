import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";

export type MaterialPurchaseOrder = {
  id: string;
  code: string;
  legacyInvoiceNumber: string | null;
  vendorId: string;
  totalAmount: number;
  completedAt: Date | null;
  cancelledAt: Date | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type MaterialPurchaseOrderWithVendor = MaterialPurchaseOrder & {
  vendor: { id: string; name: string };
};

export type MaterialPurchaseOrderItem = {
  id: string;
  materialPurchaseOrderId: string;
  materialCode: string;
  quantityOrdered: number;
  unitPrice: number;
  notes: string | null;
  material: {
    code: string;
    title: string;
    materialType: MaterialType;
    unitOfMeasurement: MaterialUnit;
    subCategoryId: string;
    unitPrice: number;
  };
};

export type MaterialPurchaseOrderDetailed = Omit<MaterialPurchaseOrder, "createdBy"> & {
  vendor: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: MaterialPurchaseOrderItem[];
};
