import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const PRODUCTION_SUB_DEPARTMENT_VALUES = [
  "cutting",
  "bending",
  "refrigeration",
  "electricity",
  "gas",
  "injection",
  "sheet_metal_neutral",
  "sheet_metal_cold",
  "sheet_metal_hot",
  "blacksmithing",
] as const;

export type ProductionSubDepartment = (typeof PRODUCTION_SUB_DEPARTMENT_VALUES)[number];

export const PRODUCTION_SUB_DEPARTMENTS = Object.fromEntries(
  PRODUCTION_SUB_DEPARTMENT_VALUES.map((type) => [type.toUpperCase(), type]),
) as {
  [K in Uppercase<ProductionSubDepartment>]: Lowercase<K>;
};

// ================ Labels ================

export const PRODUCTION_SUB_DEPARTMENT_LABELS: LocalizedEntity<ProductionSubDepartment> = {
  cutting: {
    value: "cutting",
    label: {
      en: "Cutting Dep.",
      ar: "قسم القص",
    },
  },
  bending: {
    value: "bending",
    label: {
      en: "Bending Dep.",
      ar: "قسم الثني",
    },
  },
  refrigeration: {
    value: "refrigeration",
    label: {
      en: "Refrigeration Dep.",
      ar: "قسم التبريد",
    },
  },
  electricity: {
    value: "electricity",
    label: {
      en: "Electricity Dep.",
      ar: "قسم الكهرباء",
    },
  },
  gas: {
    value: "gas",
    label: {
      en: "Gas Dep.",
      ar: "قسم الغاز",
    },
  },
  injection: {
    value: "injection",
    label: {
      en: "Injection Dep.",
      ar: "قسم الحقن",
    },
  },
  sheet_metal_neutral: {
    value: "sheet_metal_neutral",
    label: {
      en: "Sheet Metal Neutral Dep.",
      ar: "قسم سمكرة المتعادل",
    },
  },
  sheet_metal_cold: {
    value: "sheet_metal_cold",
    label: {
      en: "Sheet Metal Cold Dep.",
      ar: "قسم سمكرة البارد",
    },
  },
  sheet_metal_hot: {
    value: "sheet_metal_hot",
    label: {
      en: "Sheet Metal Hot Dep.",
      ar: "قسم سمكرة الساخن",
    },
  },
  blacksmithing: {
    value: "blacksmithing",
    label: {
      en: "Blacksmithing Dep.",
      ar: "قسم الحدادة",
    },
  },
};

export const PRODUCTION_SUB_DEPARTMENT_LABELS_LIST = Object.values(PRODUCTION_SUB_DEPARTMENT_LABELS);

// ================ Helpers ================

export function getProductionSubDepartmentLabel(productionSubDepartment: ProductionSubDepartment, locale: Locale) {
  if (!PRODUCTION_SUB_DEPARTMENT_LABELS[productionSubDepartment]) {
    console.warn(`ProductionSubDepartment \`${productionSubDepartment}\` does not exist in predefined labels.`);
    return productionSubDepartment; // Return the value itself
  } else
    return translate(
      locale,
      PRODUCTION_SUB_DEPARTMENT_LABELS[productionSubDepartment].label.en,
      PRODUCTION_SUB_DEPARTMENT_LABELS[productionSubDepartment].label.ar,
    );
}

export function isValidProductionSubDepartment(
  productionSubDepartment: string,
): productionSubDepartment is ProductionSubDepartment {
  return PRODUCTION_SUB_DEPARTMENT_VALUES.includes(productionSubDepartment as ProductionSubDepartment);
}
