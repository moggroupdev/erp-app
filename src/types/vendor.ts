import { Address } from "./address";

export type Vendor = {
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

export type VendorWithCreatedBy = Vendor & { createdBy: { id: string; name: string } };

export type VendorAddress = Address & { vendorId: string };

// ==================== DTOs ====================

export type CreateVendorDto = {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type UpdateVendorDto = Partial<CreateVendorDto>;

export type CreateVendorAddressDto = {
  countryId: string;
  cityId: string | null; // Required if the country is Egypt
  addressLine: string | null;
  isDefault: boolean;
};
