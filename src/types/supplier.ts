import { Address } from "./address";

export type Supplier = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  createdBy: string;
};

export type SupplierWithCreator = Supplier & { createdBy: { id: string; name: string } };

export type SupplierAddress = Address & { supplierId: string };

// ==================== DTOs ====================

export type CreateSupplierDto = {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type UpdateSupplierDto = Partial<CreateSupplierDto>;

export type CreateSupplierAddressDto = {
  countryId: string;
  cityId: string | null; // Required if the country is Egypt
  addressLine: string | null;
  isDefault: boolean;
};
