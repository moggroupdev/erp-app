export type Vendor = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  createdBy: { id: string; name: string };
};

export type VendorAddress = {
  id: string;
  vendorId: string;
  countryId: string;
  cityId: string | null; // Null if country is not Egypt
  addressLine: string | null;
  isDefault: boolean;
};

export type VendorWithAddresses = Vendor & { addresses: VendorAddress[] };

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
  cityId: string | null;
  addressLine: string | null;
  isDefault: boolean;
};
