import { Address } from "./address";
import type { CustomerClassification } from "@/lib/constants/enums/customer-classifications";

export type Customer = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  classification: CustomerClassification | null;
  notes: string | null;
  blacklistedAt: Date | null;
  addedToBlacklistBy: string | null;
  createdAt: Date;
  createdBy: string;
};

export type CustomerWithCreator = Customer & {
  createdBy: { id: string; name: string };
  addedToBlacklistBy: { id: string; name: string } | null;
};

export type CustomerAddress = Address & { customerId: string };

// ==================== DTOs ====================

export type CreateCustomerDto = {
  name: string;
  phone: string | null;
  email: string | null;
  classification: CustomerClassification | null;
  notes: string | null;
};

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export type CreateCustomerAddressDto = {
  countryId: string;
  cityId: string | null; // Required if the country is Egypt
  addressLine: string | null;
  isDefault: boolean;
};
