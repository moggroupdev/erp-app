import { Address } from "./address";
import type { SupplierClassification } from "@/lib/constants/enums/supplier-classifications";

export type Supplier = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  classification: SupplierClassification | null;
  notes: string | null;
  blacklistedAt: Date | null;
  addedToBlacklistBy: string | null;
  createdAt: Date;
  createdBy: string;
};

export type SupplierWithCreator = Supplier & {
  createdBy: { id: string; name: string };
  addedToBlacklistBy: { id: string; name: string } | null;
};

export type SupplierAddress = Address & { supplierId: string };

// ==================== DTOs ====================

export type CreateSupplierDto = {
  name: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  classification: SupplierClassification | null;
  notes: string | null;
};

export type UpdateSupplierDto = Partial<CreateSupplierDto>;

export type CreateSupplierAddressDto = {
  countryId: string;
  cityId: string | null; // Required if the country is Egypt
  addressLine: string | null;
  isDefault: boolean;
};
