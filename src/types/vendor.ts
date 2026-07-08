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

// ==================== DTOs ====================

export type CreateVendorDto = {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type UpdateVendorDto = Partial<CreateVendorDto>;
