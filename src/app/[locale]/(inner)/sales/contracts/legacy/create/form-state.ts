import type { ProductDimension } from "@/types/product";
import { PRODUCT_SOURCE_TYPES, type ProductSourceType } from "@/lib/constants/enums/product-source-types";
import { dateOnlyToTwoPmIso, toDatePickerValue } from "@/lib/helpers/datetime-picker";
import type {
  ContractDetailed,
  ContractItem,
  CreateLegacyContractDto,
  UpdateLegacyContractDto,
} from "@/types/contract";

export type UnitDraft = {
  key: string;
  id?: string;
  serialNumber: string;
  supplierSerialNumber: string;
  producedAt: string | null;
};

export type ItemDraft = {
  key: string;
  id?: string;
  productCode: string | null;
  productTitle: string;
  sourceType: ProductSourceType | null;
  dimensions: ProductDimension[];
  productDimensionId: string | null;
  title: string;
  unitPrice: number | "";
  quantity: number | "";
  notes: string;
  units: UnitDraft[];
};

export type LegacyFormInitial = {
  customerId: string;
  customerName: string;
  customerCode: string;
  legacyNumber: string;
  legacyWorkOrderNumber: string;
  createdAt: string | null;
  startedAt: string | null;
  deliveryTime: string | null;
  items: ItemDraft[];
};

type Translate = (en: string, ar: string) => string;

const SERIAL_PATTERN = /^\d{12}$/;

/** Convert Eastern/Persian digits to ASCII, then keep digits only. */
export function normalizeSerialDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
}

export function createKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyUnit(): UnitDraft {
  return {
    key: createKey("unit"),
    serialNumber: "",
    supplierSerialNumber: "",
    producedAt: null,
  };
}

export function createEmptyItem(): ItemDraft {
  return {
    key: createKey("item"),
    productCode: null,
    productTitle: "",
    sourceType: null,
    dimensions: [],
    productDimensionId: null,
    title: "",
    unitPrice: "",
    quantity: 1,
    notes: "",
    units: [createEmptyUnit()],
  };
}

export function isImportedSource(sourceType: ProductSourceType | null) {
  return sourceType === PRODUCT_SOURCE_TYPES.IMPORTED;
}

export function unitHasContent(unit: UnitDraft) {
  return unit.serialNumber.trim() !== "" || unit.supplierSerialNumber.trim() !== "" || !!unit.producedAt;
}

export function isItemUntouched(item: ItemDraft) {
  return (
    item.productCode == null &&
    item.title.trim() === "" &&
    item.unitPrice === "" &&
    item.quantity === 1 &&
    item.notes.trim() === "" &&
    item.units.length === 1 &&
    !unitHasContent(item.units[0])
  );
}

export function selectedDimension(item: ItemDraft) {
  return item.dimensions.find((dimension) => dimension.id === item.productDimensionId) ?? null;
}

export function droppedUnitsHaveContent(units: UnitDraft[], nextQuantity: number) {
  if (nextQuantity >= units.length) return false;
  return units.slice(nextQuantity).some(unitHasContent);
}

export function unitsForQuantity(units: UnitDraft[], quantity: number): UnitDraft[] {
  if (quantity < 1) return units;
  if (units.length === quantity) return units;
  if (units.length < quantity) {
    return [...units, ...Array.from({ length: quantity - units.length }, () => createEmptyUnit())];
  }
  return units.slice(0, quantity);
}

export function lineTitle(item: ItemDraft) {
  const title = item.title.trim();
  if (title) return title;
  return item.productTitle.trim();
}

export function validateContractStep(
  input: {
    customerId: string | null;
    legacyNumber: string;
    legacyWorkOrderNumber: string;
    createdAt: string | null;
    startedAt: string | null;
    deliveryTime: string | null;
  },
  translate: Translate,
) {
  if (!input.customerId) return translate("Choose a customer.", "اختر عميلاً.");
  if (!input.legacyNumber.trim()) return translate("Enter the legacy contract review number.", "أدخل رقم مراجعة العقد.");
  if (!input.legacyWorkOrderNumber.trim()) return translate("Enter the legacy work order number.", "أدخل رقم أمر الشغل.");
  const { createdAt, startedAt, deliveryTime } = input;

  if (!createdAt || !dateOnlyToTwoPmIso(createdAt)) {
    return translate("Choose the contract review date.", "اختر تاريخ مراجعة العقد.");
  }
  if (!startedAt || !dateOnlyToTwoPmIso(startedAt)) {
    return translate("Choose the work order start date.", "اختر تاريخ بداية أمر الشغل.");
  }
  if (!deliveryTime || !dateOnlyToTwoPmIso(deliveryTime)) {
    return translate("Choose the delivery date.", "اختر تاريخ التسليم.");
  }

  // Order: contract review date → work order start → delivery planned (same day allowed).
  if (startedAt < createdAt) {
    return translate(
      "Work order start date cannot be earlier than the contract review date.",
      "لا يمكن أن يسبق تاريخ بدء أمر الشغل تاريخ مراجعة العقد.",
    );
  }
  if (deliveryTime < startedAt) {
    return translate(
      "Delivery planned date cannot be earlier than the work order start date.",
      "لا يمكن أن يسبق تاريخ التسليم المخطط تاريخ بدء أمر الشغل.",
    );
  }

  return null;
}

export function validateItemsStep(items: ItemDraft[], translate: Translate) {
  if (items.length === 0) return translate("Add at least one contract review line.", "أضف بندًا واحدًا على الأقل.");

  for (const [index, item] of items.entries()) {
    const line = index + 1;
    if (!item.productCode) return translate(`Line ${line}: choose a product.`, `البند ${line}: اختر منتجًا.`);
    if (item.dimensions.length === 0) {
      return translate(`Line ${line}: this product has no dimensions.`, `البند ${line}: هذا المنتج بلا مقاسات.`);
    }
    if (!item.productDimensionId) return translate(`Line ${line}: choose a dimension.`, `البند ${line}: اختر مقاسًا.`);
    if (item.unitPrice !== "" && !(Number(item.unitPrice) > 0)) {
      return translate(
        `Line ${line}: unit price must be greater than 0 when entered.`,
        `البند ${line}: يجب أن يكون سعر الوحدة أكبر من 0 عند إدخاله.`,
      );
    }
    if (item.quantity === "" || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      return translate(`Line ${line}: enter a quantity of at least 1.`, `البند ${line}: أدخل كمية لا تقل عن 1.`);
    }
    if (item.units.length !== Number(item.quantity)) {
      return translate(
        `Line ${line}: product units must match the quantity.`,
        `البند ${line}: يجب أن يطابق عدد وحدات المنتج الكمية.`,
      );
    }
  }

  return null;
}

export function validateUnitsStep(items: ItemDraft[], translate: Translate) {
  const serials = new Set<string>();
  const supplierSerials = new Set<string>();

  for (const [index, item] of items.entries()) {
    const line = index + 1;
    const imported = isImportedSource(item.sourceType);

    for (const [unitIndex, unit] of item.units.entries()) {
      const serial = unit.serialNumber.trim();
      const place = translate(`Line ${line}, unit ${unitIndex + 1}`, `البند ${line}، الوحدة ${unitIndex + 1}`);
      if (!SERIAL_PATTERN.test(serial)) {
        return translate(
          `${place}: serial number must be exactly 12 digits.`,
          `${place}: يجب أن يتكون الرقم التسلسلي من 12 رقمًا بالضبط.`,
        );
      }
      if (serials.has(serial)) {
        return translate(`${place}: serial number ${serial} is repeated.`, `${place}: الرقم التسلسلي ${serial} مكرر.`);
      }
      serials.add(serial);

      const supplierSerial = unit.supplierSerialNumber.trim();
      if (imported && !supplierSerial) {
        return translate(`${place}: supplier serial number is required.`, `${place}: الرقم التسلسلي للمورد مطلوب.`);
      }
      if (imported && supplierSerial) {
        if (supplierSerials.has(supplierSerial)) {
          return translate(
            `${place}: supplier serial number ${supplierSerial} is repeated.`,
            `${place}: الرقم التسلسلي للمورد ${supplierSerial} مكرر.`,
          );
        }
        supplierSerials.add(supplierSerial);
      }
    }
  }

  return null;
}

/** Highest step index the user may open: 0 until the previous step's data is complete. */
export function getMaxReachableLegacyStep(
  input: Parameters<typeof validateContractStep>[0],
  items: ItemDraft[],
) {
  const silent: Translate = () => "";
  if (validateContractStep(input, silent) !== null) return 0;
  if (validateItemsStep(items, silent) !== null) return 1;
  if (validateUnitsStep(items, silent) !== null) return 2;
  return 3;
}

type LegacyContractDtoInput = {
  customerId: string;
  legacyNumber: string;
  legacyWorkOrderNumber: string;
  createdAt: string;
  startedAt: string;
  deliveryTime: string;
  items: ItemDraft[];
};

function legacyContractHeader(input: LegacyContractDtoInput) {
  return {
    customerId: input.customerId,
    legacyNumber: input.legacyNumber.trim(),
    legacyWorkOrderNumber: input.legacyWorkOrderNumber.trim(),
    createdAt: dateOnlyToTwoPmIso(input.createdAt)!,
    startedAt: dateOnlyToTwoPmIso(input.startedAt)!,
    deliveryTime: dateOnlyToTwoPmIso(input.deliveryTime)!,
  };
}

export function buildLegacyContractDto(input: LegacyContractDtoInput): CreateLegacyContractDto {
  return {
    ...legacyContractHeader(input),
    items: input.items.map((item) => ({
      productDimensionId: item.productDimensionId!,
      title: item.title.trim() || null,
      unitPrice: item.unitPrice === "" ? null : Number(item.unitPrice),
      quantity: Number(item.quantity),
      notes: item.notes.trim() || null,
      units: item.units.map((unit) => ({
        serialNumber: unit.serialNumber.trim(),
        supplierSerialNumber: isImportedSource(item.sourceType) ? unit.supplierSerialNumber.trim() || null : null,
        producedAt: dateOnlyToTwoPmIso(unit.producedAt),
      })),
    })),
  };
}

export function buildUpdateLegacyContractDto(input: LegacyContractDtoInput): UpdateLegacyContractDto {
  return {
    ...legacyContractHeader(input),
    items: input.items.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      productDimensionId: item.productDimensionId!,
      title: item.title.trim() || null,
      unitPrice: item.unitPrice === "" ? null : Number(item.unitPrice),
      quantity: Number(item.quantity),
      notes: item.notes.trim() || null,
      units: item.units.map((unit) => ({
        ...(unit.id ? { id: unit.id } : {}),
        serialNumber: unit.serialNumber.trim(),
        supplierSerialNumber: isImportedSource(item.sourceType) ? unit.supplierSerialNumber.trim() || null : null,
        producedAt: dateOnlyToTwoPmIso(unit.producedAt),
      })),
    })),
  };
}

export function legacyFormSnapshot(input: {
  customerId: string | null;
  legacyNumber: string;
  legacyWorkOrderNumber: string;
  createdAt: string | null;
  startedAt: string | null;
  deliveryTime: string | null;
  items: ItemDraft[];
}) {
  return JSON.stringify({
    customerId: input.customerId,
    legacyNumber: input.legacyNumber.trim(),
    legacyWorkOrderNumber: input.legacyWorkOrderNumber.trim(),
    createdAt: input.createdAt,
    startedAt: input.startedAt,
    deliveryTime: input.deliveryTime,
    items: input.items.map((item) => ({
      id: item.id ?? null,
      productCode: item.productCode,
      productDimensionId: item.productDimensionId,
      title: item.title.trim(),
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      notes: item.notes.trim(),
      units: item.units.map((unit) => ({
        id: unit.id ?? null,
        serialNumber: unit.serialNumber.trim(),
        supplierSerialNumber: unit.supplierSerialNumber.trim(),
        producedAt: unit.producedAt,
      })),
    })),
  });
}

export function toLegacyFormInitial(
  contract: ContractDetailed,
  productsByCode: Map<string, { title: string; sourceType: ProductSourceType; dimensions: ProductDimension[] }>,
): LegacyFormInitial {
  const activeItems = contract.items.filter((item) => !item.cancelledAt);
  return {
    customerId: contract.customer.id,
    customerName: contract.customer.name,
    customerCode: contract.customer.code,
    legacyNumber: contract.legacyNumber ?? "",
    legacyWorkOrderNumber: contract.legacyWorkOrderNumber ?? "",
    createdAt: toDatePickerValue(contract.createdAt),
    startedAt: contract.startedAt ? toDatePickerValue(contract.startedAt) : null,
    deliveryTime: contract.deliveryTime ? toDatePickerValue(contract.deliveryTime) : null,
    items: activeItems.length > 0 ? activeItems.map((item) => toItemDraftFromContract(item, productsByCode)) : [createEmptyItem()],
  };
}

function toItemDraftFromContract(
  item: ContractItem,
  productsByCode: Map<string, { title: string; sourceType: ProductSourceType; dimensions: ProductDimension[] }>,
): ItemDraft {
  const product = productsByCode.get(item.productCode);
  const dimensions = [...(product?.dimensions ?? [])];
  if (!dimensions.some((dimension) => dimension.id === item.productDimension.id)) {
    dimensions.push({
      id: item.productDimension.id,
      productCode: item.productCode,
      length: item.productDimension.length,
      depth: item.productDimension.depth,
      diameter: item.productDimension.diameter,
      height: item.productDimension.height,
      isDefault: false,
      notes: null,
      createdAt: new Date(),
      createdBy: "",
    });
  }

  const units = item.productUnits.filter((unit) => !unit.cancelledAt);
  return {
    key: item.id,
    id: item.id,
    productCode: item.productCode,
    productTitle: product?.title ?? item.product.title,
    sourceType: product?.sourceType ?? null,
    dimensions,
    productDimensionId: item.productDimension.id,
    title: item.title ?? "",
    unitPrice: item.unitPrice ?? "",
    quantity: item.quantity,
    notes: item.notes ?? "",
    units:
      units.length > 0
        ? units.map((unit) => ({
            key: unit.id,
            id: unit.id,
            serialNumber: unit.serialNumber,
            supplierSerialNumber: unit.supplierSerialNumber ?? "",
            producedAt: unit.producedAt ? toDatePickerValue(unit.producedAt) : null,
          }))
        : unitsForQuantity([], item.quantity),
  };
}
