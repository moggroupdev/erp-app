import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MATERIAL_TYPE_VALUES = [
  "raw_materials",
  "manufactured_material",
  "spare_parts",
  "tools_and_equipment",
  "supplied_products",
] as const;

export type MaterialType = (typeof MATERIAL_TYPE_VALUES)[number];

export const MATERIAL_TYPES = Object.fromEntries(MATERIAL_TYPE_VALUES.map((type) => [type.toUpperCase(), type])) as {
  [K in Uppercase<MaterialType>]: Lowercase<K>;
};

// ================ Labels ================

export const MATERIAL_TYPE_LABELS: LocalizedEntity<MaterialType> = {
  raw_materials: {
    value: "raw_materials",
    label: {
      en: "Raw Materials",
      ar: "مواد خام",
    },
  },
  manufactured_material: {
    value: "manufactured_material",
    label: {
      en: "Manufactured Materials",
      ar: "مواد مصنعة",
    },
  },
  spare_parts: {
    value: "spare_parts",
    label: {
      en: "Spare Parts",
      ar: "قطع غيار",
    },
  },
  tools_and_equipment: {
    value: "tools_and_equipment",
    label: {
      en: "Tools and Equipment",
      ar: "عدد وأدوات",
    },
  },
  supplied_products: {
    value: "supplied_products",
    label: {
      en: "Supplied Products",
      ar: "منتجات موردة",
    },
  },
};

export const MATERIAL_TYPE_LABELS_LIST = Object.values(MATERIAL_TYPE_LABELS);

// ================ Helpers ================

export function getMaterialTypeLabel(materialType: MaterialType, locale: Locale) {
  if (!MATERIAL_TYPE_LABELS[materialType]) {
    console.warn(`MaterialType \`${materialType}\` does not exist in predefined labels.`);
    return materialType;
  }
  return translate(locale, MATERIAL_TYPE_LABELS[materialType].label.en, MATERIAL_TYPE_LABELS[materialType].label.ar);
}

export function isValidMaterialType(materialType: string): materialType is MaterialType {
  return MATERIAL_TYPE_VALUES.includes(materialType as MaterialType);
}

export function isRawMaterial(materialType: MaterialType) {
  return materialType === MATERIAL_TYPES.RAW_MATERIALS;
}

export function isSparePart(materialType: MaterialType) {
  return materialType === MATERIAL_TYPES.SPARE_PARTS;
}

export function isManufacturedMaterial(materialType: MaterialType) {
  return materialType === MATERIAL_TYPES.MANUFACTURED_MATERIAL;
}

export function isToolsAndEquipment(materialType: MaterialType) {
  return materialType === MATERIAL_TYPES.TOOLS_AND_EQUIPMENT;
}

export function isSuppliedProduct(materialType: MaterialType) {
  return materialType === MATERIAL_TYPES.SUPPLIED_PRODUCTS;
}

/** Spare parts, tools and equipment, and supplied products stay on count. */
export function isUnitLockedToCount(materialType: MaterialType) {
  return isSparePart(materialType) || isToolsAndEquipment(materialType) || isSuppliedProduct(materialType);
}

/** Types locked to count have no alternate units. Raw and manufactured materials can define them. */
export function supportsUnitConversions(materialType: MaterialType) {
  return isRawMaterial(materialType) || isManufacturedMaterial(materialType);
}
