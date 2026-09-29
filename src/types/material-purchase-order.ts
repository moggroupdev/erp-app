import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MpoDeliveryLocation } from "@/lib/constants/enums/mpo-delivery-locations";
import type { MpoDeliveryTiming } from "@/lib/constants/enums/mpo-delivery-timings";
import type { MpoPaymentEvent } from "@/lib/constants/enums/mpo-payment-events";
import type { MpoPaymentValueKind } from "@/lib/constants/enums/mpo-payment-value-kinds";
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

// =============== Supplier Invoices ===============

export type SupplierInvoice = {
  id: string;
  invoiceNumber: string;
  issuedAt: Date | null;
  totalPurchases: number | null;
  totalDiscount: number | null;
  vatAmount: number | null;
  withholdingTaxAmount: number | null;
  totalAmount: number | null;
  materialPurchaseOrderId: string | null;
  productPurchaseOrderId: string | null;
  outsourcingOrderId: string | null;
  supplierId: string;
  pdfFilename: string | null;
  createdAt: Date;
  createdBy: string;
};

type SupplierInvoiceOrderLink = { id: string; code: string };

export type SupplierInvoiceWithLinks = SupplierInvoice & {
  supplier: { id: string; name: string };
  materialPurchaseOrder: SupplierInvoiceOrderLink | null;
  productPurchaseOrder: SupplierInvoiceOrderLink | null;
  outsourcingOrder: SupplierInvoiceOrderLink | null;
};

export type SupplierInvoiceDetailed = Omit<SupplierInvoice, "createdBy"> & {
  supplier: { id: string; name: string };
  materialPurchaseOrder: SupplierInvoiceOrderLink | null;
  productPurchaseOrder: SupplierInvoiceOrderLink | null;
  outsourcingOrder: SupplierInvoiceOrderLink | null;
  createdBy: { id: string; name: string };
};

// =============== Material Purchase Orders ===============

export type MaterialPurchaseOrder = {
  id: string;
  code: string;
  supplierId: string;
  totalAmount: number;
  deliveryLocation: MpoDeliveryLocation | null;
  deliveryTiming: MpoDeliveryTiming | null;
  deliveryPeriodDays: number | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
};

export type MaterialPurchaseOrderWithSupplier = MaterialPurchaseOrder & {
  supplier: { id: string; name: string };
  invoices?: Pick<SupplierInvoice, "id" | "invoiceNumber" | "issuedAt" | "totalPurchases">[];
};

export type MaterialPurchaseOrderItemRequisitionAllocation = {
  id: string;
  materialPurchaseRequisitionItemId: string;
  quantityAllocated: number;
  unitOfMeasurementSelected: MaterialUnit;
  requisition: {
    id: string;
    code: string;
    productionSubDepartment: string;
  };
};

export type MaterialPurchaseOrderItem = {
  id: string;
  materialPurchaseOrderId: string;
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityOrdered: number;
  unitPrice: number;
  notes: string | null;
  material: PurchaseMaterialWithUnitConversion;
  /** Accepted qty across receipts, in the order line's selected unit. */
  quantityReceived?: number;
  /** Remaining qty in the order line's selected unit (ordered − received − rejected across receipts). */
  quantityRemaining?: number;
  requisitionAllocations?: MaterialPurchaseOrderItemRequisitionAllocation[];
};

export type MaterialPurchaseOrderPaymentTerm = {
  id: string;
  materialPurchaseOrderId: string;
  sequenceOrder: number;
  event: MpoPaymentEvent;
  offsetDays: number | null;
  valueKind: MpoPaymentValueKind;
  value: number | null;
};

export type MaterialPurchaseOrderDetailed = Omit<MaterialPurchaseOrder, "createdBy"> & {
  supplier: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: MaterialPurchaseOrderItem[];
  paymentTerms: MaterialPurchaseOrderPaymentTerm[];
};

export type CreateMaterialPurchaseOrderItemRequisitionAllocationDto = {
  materialPurchaseRequisitionItemId: string;
  /** Quantity in the requisition line's selected unit. */
  quantityAllocated: number;
};

export type CreateMaterialPurchaseOrderItemDto = {
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityOrdered: number;
  unitPrice: number;
  notes: string | null;
  requisitionAllocations: CreateMaterialPurchaseOrderItemRequisitionAllocationDto[];
};

export type CreateMaterialPurchaseOrderPaymentTermDto = {
  event: MpoPaymentEvent;
  offsetDays?: number | null;
  valueKind: MpoPaymentValueKind;
  value?: number | null;
};

export type CreateMaterialPurchaseOrderDto = {
  supplierId: string;
  deliveryLocation: MpoDeliveryLocation;
  deliveryTiming: MpoDeliveryTiming;
  deliveryPeriodDays?: number | null;
  notes: string | null;
  items: CreateMaterialPurchaseOrderItemDto[];
  paymentTerms: CreateMaterialPurchaseOrderPaymentTermDto[];
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
  unitOfMeasurementSelected: MaterialUnit;
  quantityReceived: number;
  quantityRejected: number;
  inspectionNotes: string | null;
  materialPurchaseOrderItem: {
    id: string;
    materialCode: string;
    unitOfMeasurementSelected: MaterialUnit;
    quantityOrdered: number;
    unitPrice: number;
    material: PurchaseMaterialWithUnitConversion;
  };
};

export type MaterialPurchaseReceiptDetailed = Omit<MaterialPurchaseReceipt, "createdBy" | "receivedBy"> & {
  materialPurchaseOrder: { id: string; code: string };
  inventoryTransactions: { id: string; legacyNumber: string | null }[];
  createdBy: { id: string; name: string };
  receivedBy: { id: string; name: string } | null;
  items: MaterialPurchaseReceiptItem[];
};

export type CreateMaterialPurchaseReceiptItemDto = {
  materialPurchaseOrderItemId: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityReceived: number;
  quantityRejected: number;
  inspectionNotes: string | null;
};

export type CreateMaterialPurchaseReceiptDto = {
  materialPurchaseOrderId: string;
  notes: string | null;
  receivedAt?: string | null;
  items: CreateMaterialPurchaseReceiptItemDto[];
};

export type CreatedMaterialPurchaseReceipt = MaterialPurchaseReceipt & {
  items: Omit<MaterialPurchaseReceiptItem, "materialPurchaseOrderItem">[];
};
