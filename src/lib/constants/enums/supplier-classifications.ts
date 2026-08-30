import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const SUPPLIER_CLASSIFICATION_VALUES = [
  "aluminum",
  "stainless_steel",
  "sheet_steel",
  "copper",
  "plastic",
  "glass",
  "insulation",
  "electrical",
  "refrigeration",
  "gas",
  "hardware",
  "coatings",
  "spare_parts",
  "imported_equipment",
  "services",
  "general",
] as const;

export type SupplierClassification = (typeof SUPPLIER_CLASSIFICATION_VALUES)[number];

export const SUPPLIER_CLASSIFICATIONS = Object.fromEntries(
  SUPPLIER_CLASSIFICATION_VALUES.map((classification) => [classification.toUpperCase(), classification]),
) as {
  [K in Uppercase<SupplierClassification>]: Lowercase<K>;
};

// ================ Labels ================

export const SUPPLIER_CLASSIFICATION_LABELS: LocalizedEntity<SupplierClassification> = {
  aluminum: {
    value: "aluminum",
    label: { en: "Aluminum", ar: "ألومونيوم" },
  },
  stainless_steel: {
    value: "stainless_steel",
    label: { en: "Stainless Steel", ar: "ستانلس ستيل" },
  },
  sheet_steel: {
    value: "sheet_steel",
    label: { en: "Sheet Steel", ar: "صاج" },
  },
  copper: {
    value: "copper",
    label: { en: "Copper", ar: "نحاس" },
  },
  plastic: {
    value: "plastic",
    label: { en: "Plastic", ar: "بلاستيك" },
  },
  glass: {
    value: "glass",
    label: { en: "Glass", ar: "زجاج" },
  },
  insulation: {
    value: "insulation",
    label: { en: "Insulation", ar: "عوازل" },
  },
  electrical: {
    value: "electrical",
    label: { en: "Electrical", ar: "كهرباء" },
  },
  refrigeration: {
    value: "refrigeration",
    label: { en: "Refrigeration", ar: "تبريد" },
  },
  gas: {
    value: "gas",
    label: { en: "Gas", ar: "غاز" },
  },
  hardware: {
    value: "hardware",
    label: { en: "Hardware", ar: "مهمات" },
  },
  coatings: {
    value: "coatings",
    label: { en: "Coatings and Paints", ar: "دهانات وطلاء" },
  },
  spare_parts: {
    value: "spare_parts",
    label: { en: "Spare Parts", ar: "قطع غيار" },
  },
  imported_equipment: {
    value: "imported_equipment",
    label: { en: "Imported Equipment", ar: "معدات مستوردة" },
  },
  services: {
    value: "services",
    label: { en: "Services", ar: "خدمات" },
  },
  general: {
    value: "general",
    label: { en: "General", ar: "عام" },
  },
};

export const SUPPLIER_CLASSIFICATION_LABELS_LIST = Object.values(SUPPLIER_CLASSIFICATION_LABELS);

// ================ Helpers ================

export function getSupplierClassificationLabel(classification: SupplierClassification, locale: Locale) {
  if (!SUPPLIER_CLASSIFICATION_LABELS[classification]) {
    console.warn(`SupplierClassification \`${classification}\` does not exist in predefined labels.`);
    return classification;
  }
  return translate(
    locale,
    SUPPLIER_CLASSIFICATION_LABELS[classification].label.en,
    SUPPLIER_CLASSIFICATION_LABELS[classification].label.ar,
  );
}

export function isValidSupplierClassification(classification: string): classification is SupplierClassification {
  return SUPPLIER_CLASSIFICATION_VALUES.includes(classification as SupplierClassification);
}
