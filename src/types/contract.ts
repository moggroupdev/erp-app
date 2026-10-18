export type ContractListItem = {
  id: string;
  code: string;
  legacyNumber: string | null;
  legacyWorkOrderNumber: string | null;
  customerId: string;
  deliveryTime: string | null;
  totalAmount: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  customer: { id: string; code: string; name: string };
  createdBy: { id: string; name: string };
};

export type ContractProductDimension = {
  id: string;
  length: number | null;
  depth: number | null;
  diameter: number | null;
  height: number;
};

export type ContractProductUnit = {
  id: string;
  serialNumber: string;
  supplierSerialNumber: string | null;
  producedAt: string | null;
  receivedAt: string | null;
  deliveredAt: string | null;
  installedAt: string | null;
  warrantyStartedAt: string | null;
  notes: string | null;
  cancelledAt: string | null;
};

export type ContractItem = {
  id: string;
  title: string | null;
  notes: string | null;
  unitPrice: number;
  quantity: number;
  productCode: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  product: { code: string; title: string };
  productDimension: ContractProductDimension;
  productUnits: ContractProductUnit[];
};

export type CreateLegacyContractUnitDto = {
  serialNumber: string;
  supplierSerialNumber: string | null;
  producedAt: string | null;
};

export type CreateLegacyContractItemDto = {
  productDimensionId: string;
  title: string | null;
  unitPrice: number;
  quantity: number;
  notes: string | null;
  units: CreateLegacyContractUnitDto[];
};

export type CreateLegacyContractDto = {
  customerId: string;
  legacyNumber: string;
  legacyWorkOrderNumber: string;
  createdAt: string;
  startedAt: string;
  deliveryTime: string;
  deliveryAddressId: string | null;
  items: CreateLegacyContractItemDto[];
};

export type ValidateLegacyContractDto = Omit<CreateLegacyContractDto, "items">;

export type ValidateLegacyContractItemsDto = {
  items: { productDimensionId: string }[];
};

export type ValidateLegacyContractUnitsDto = {
  items: CreateLegacyContractItemDto[];
};

export type CreatedLegacyContract = {
  id: string;
  code: string;
};

export type ContractDetailed = {
  id: string;
  code: string;
  legacyNumber: string | null;
  legacyWorkOrderNumber: string | null;
  deliveryTime: string | null;
  totalAmount: number;
  discountPct: number | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: string;
  customer: { id: string; code: string; name: string };
  deliveryAddress: {
    id: string;
    addressLine: string | null;
    cityId: string | null;
    countryId: string;
  } | null;
  createdBy: { id: string; name: string };
  cancelledByUser: { id: string; name: string } | null;
  inquiry: { id: string; status: string } | null;
  preview: { id: string; scheduledAt: string } | null;
  offer: { id: string; status: string } | null;
  items: ContractItem[];
};
