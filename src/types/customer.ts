import { Address } from "./address";
import { ContactPerson } from "./contact-person";
import type { CustomerClassification } from "@/lib/constants/enums/customer-classifications";

export type Customer = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  commercialRegistrationNumber: string | null;
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

export type CustomerContactPerson = ContactPerson & { customerId: string };

// ==================== DTOs ====================

export type CreateCustomerDto = {
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxNumber: string | null;
  commercialRegistrationNumber: string | null;
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

export type CreateCustomerContactPersonDto = {
  name: string;
  jobTitle: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
};
