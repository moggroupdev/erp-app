import { Address } from "./address";

export type Customer = {
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

export type CustomerWithCreator = Customer & { createdBy: { id: string; name: string } };

export type CustomerAddress = Address & { customerId: string };

// ==================== DTOs ====================

export type CreateCustomerDto = {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export type CreateCustomerAddressDto = {
  countryId: string;
  cityId: string | null; // Required if the country is Egypt
  addressLine: string | null;
  isDefault: boolean;
};
