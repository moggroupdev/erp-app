import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const CUSTOMER_CLASSIFICATION_VALUES = [
  "restaurant",
  "hotel",
  "tourist_village",
  "hospital",
  "residential",
  "cafe",
  "bakery",
  "factory",
  "shopping_mall",
  "sports_club",
  "banquet_hall",
  "supermarket",
  "corporate",
] as const;

export type CustomerClassification = (typeof CUSTOMER_CLASSIFICATION_VALUES)[number];

export const CUSTOMER_CLASSIFICATIONS = Object.fromEntries(
  CUSTOMER_CLASSIFICATION_VALUES.map((classification) => [classification.toUpperCase(), classification]),
) as {
  [K in Uppercase<CustomerClassification>]: Lowercase<K>;
};

// ================ Labels ================

export const CUSTOMER_CLASSIFICATION_LABELS: LocalizedEntity<CustomerClassification> = {
  restaurant: {
    value: "restaurant",
    label: { en: "Restaurant", ar: "مطعم" },
  },
  hotel: {
    value: "hotel",
    label: { en: "Hotel", ar: "فندق" },
  },
  tourist_village: {
    value: "tourist_village",
    label: { en: "Tourist Village", ar: "قرية سياحية" },
  },
  hospital: {
    value: "hospital",
    label: { en: "Hospital", ar: "مستشفى" },
  },
  residential: {
    value: "residential",
    label: { en: "Residential", ar: "منزل" },
  },
  cafe: {
    value: "cafe",
    label: { en: "Cafe", ar: "كافيه" },
  },
  bakery: {
    value: "bakery",
    label: { en: "Bakery", ar: "مخبز" },
  },
  factory: {
    value: "factory",
    label: { en: "Factory", ar: "مصنع" },
  },
  shopping_mall: {
    value: "shopping_mall",
    label: { en: "Shopping Mall", ar: "مول تجاري" },
  },
  sports_club: {
    value: "sports_club",
    label: { en: "Sports Club", ar: "نادي رياضي" },
  },
  banquet_hall: {
    value: "banquet_hall",
    label: { en: "Banquet Hall", ar: "قاعة أفراح" },
  },
  supermarket: {
    value: "supermarket",
    label: { en: "Supermarket", ar: "سوبر ماركت" },
  },
  corporate: {
    value: "corporate",
    label: { en: "Corporate", ar: "شركة" },
  },
};

export const CUSTOMER_CLASSIFICATION_LABELS_LIST = Object.values(CUSTOMER_CLASSIFICATION_LABELS);

// ================ Helpers ================

export function getCustomerClassificationLabel(classification: CustomerClassification, locale: Locale) {
  if (!CUSTOMER_CLASSIFICATION_LABELS[classification]) {
    console.warn(`CustomerClassification \`${classification}\` does not exist in predefined labels.`);
    return classification;
  }
  return translate(
    locale,
    CUSTOMER_CLASSIFICATION_LABELS[classification].label.en,
    CUSTOMER_CLASSIFICATION_LABELS[classification].label.ar,
  );
}

export function isValidCustomerClassification(classification: string): classification is CustomerClassification {
  return CUSTOMER_CLASSIFICATION_VALUES.includes(classification as CustomerClassification);
}
