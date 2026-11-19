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

// ==================== Merge ====================

export type CustomerMergeReferenceGroupKey =
  | "customer_addresses"
  | "customer_contact_persons"
  | "inquiries"
  | "contracts"
  | "customer_receptions"
  | "maintenance_orders"
  | "legacy_issue_permits"
  | "service_agreements_via_addresses"
  | "contracts_delivery_address"
  | "maintenance_orders_address"
  | "maintenance_orders_service_agreement";

export type CustomerMergeSummary = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  commercialRegistrationNumber: string | null;
  classification: CustomerClassification | null;
  website: string | null;
  notes: string | null;
  blacklistedAt: string | null;
};

export type CustomerMergeUniqueFieldPlan = {
  column: "phone" | "email" | "taxNumber" | "commercialRegistrationNumber";
  dbColumn: "phone" | "email" | "tax_number" | "commercial_registration_number";
  keepValue: string | null;
  removeValue: string | null;
  fill: boolean;
};

export type CustomerMergeFillFieldPlan = {
  label: "classification" | "website" | "notes";
  keepValue: string | null;
  removeValue: string | null;
  fill: boolean;
  drop: boolean;
};

export type CustomerMergeFieldPlan = {
  uniqueFields: CustomerMergeUniqueFieldPlan[];
  fillFields: CustomerMergeFillFieldPlan[];
  copyBlacklist: boolean;
  nameKept: string;
  nameDropped: string | null;
};

export type CustomerMergeFlagClearPlan = {
  clearRemovedDefaultAddress: boolean;
  clearRemovedPrimaryContact: boolean;
  keptHasDefaultAddress: boolean;
  removedHasDefaultAddress: boolean;
  keptHasPrimaryContact: boolean;
  removedHasPrimaryContact: boolean;
};

export type CustomerMergePreview = {
  kept: CustomerMergeSummary;
  removed: CustomerMergeSummary | null;
  referenceCounts: { key: CustomerMergeReferenceGroupKey; count: number }[];
  followCounts: { key: CustomerMergeReferenceGroupKey; count: number }[];
  flagClear: CustomerMergeFlagClearPlan | null;
  fieldPlan: CustomerMergeFieldPlan | null;
  blockers: string[];
  canMerge: boolean;
};

export type MergeCustomerDto = {
  removeId: string;
  confirmationCode: string;
};
