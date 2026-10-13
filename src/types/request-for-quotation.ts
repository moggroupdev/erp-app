import type { MaterialType } from "@/lib/constants/enums/material-types";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";

type UserRef = { id: string; name: string };

export type RequestForQuotationStatus = "open" | "closed" | "cancelled";

type QuotationMaterial = {
  code: string;
  title: string;
  materialType: MaterialType;
  unitOfMeasurement: MaterialUnit;
  subCategoryId: string;
  unitConversions: MaterialUnitConversionSummary[];
};

export type RequestForQuotation = {
  id: string;
  code: string;
  notes: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  createdBy: string;
};

export type RequestForQuotationListItem = Omit<RequestForQuotation, "createdBy"> & {
  createdBy: UserRef;
};

export type RequestForQuotationItem = {
  id: string;
  requestForQuotationId: string;
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityRequested: number;
  notes: string | null;
  material: QuotationMaterial;
};

export type SupplierQuotationItem = {
  id: string;
  supplierQuotationId: string;
  requestForQuotationItemId: string;
  requestForQuotationId: string;
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  unitPrice: number;
  notes: string | null;
};

export type SupplierQuotation = {
  id: string;
  requestForQuotationId: string;
  supplierId: string;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  deliveryPeriodDays: number | null;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: UserRef;
  supplier: { id: string; name: string };
  items: SupplierQuotationItem[];
};

export type RequestForQuotationDetailed = Omit<RequestForQuotation, "createdBy"> & {
  createdBy: UserRef;
  items: RequestForQuotationItem[];
  supplierQuotations: SupplierQuotation[];
};

export type SupplierQuotationItemOption = {
  id: string;
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  unitPrice: number;
  requestForQuotationId: string;
  requestForQuotationCode: string;
  requestForQuotationItemId: string;
  quantityRequested: number;
  requestedUnit: MaterialUnit;
};

export type CreateRequestForQuotationItemDto = {
  materialCode: string;
  unitOfMeasurementSelected: MaterialUnit;
  quantityRequested: number;
  notes: string | null;
};

export type CreateRequestForQuotationDto = {
  notes: string | null;
  items: CreateRequestForQuotationItemDto[];
};

export type UpdateRequestForQuotationDto = {
  notes?: string | null;
};
