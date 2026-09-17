import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const PRODUCTION_SUB_DEPARTMENT_VALUES = [
  "cutting",
  "punch",
  "bending",
  "refrigeration",
  "electricity",
  "gas",
  "injection",
  "sheet_metal_neutral",
  "sheet_metal_cold",
  "sheet_metal_hot",
  "kitchens",
  "paints",
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
  punch: {
    value: "punch",
    label: {
      en: "Punch Dep.",
      ar: "قسم البنش",
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
  kitchens: {
    value: "kitchens",
    label: {
      en: "Kitchens Dep.",
      ar: "قسم المطابخ",
    },
  },
  paints: {
    value: "paints",
    label: {
      en: "Paints Dep.",
      ar: "قسم الدهانات",
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

/** Lower rank is shown first. Same rank keeps the key order in this map. */
export const PRODUCTION_SUB_DEPARTMENT_SORT_RANKS: Record<ProductionSubDepartment, number> = {
  cutting: 1,
  punch: 1,
  bending: 1,
  sheet_metal_neutral: 2,
  sheet_metal_cold: 2,
  sheet_metal_hot: 2,
  kitchens: 2,
  electricity: 3,
  gas: 3,
  injection: 4,
  refrigeration: 5,
  paints: 6,
  blacksmithing: 6,
};

const PRODUCTION_SUB_DEPARTMENT_SORT_INDEX: Record<ProductionSubDepartment, number> = Object.fromEntries(
  (Object.keys(PRODUCTION_SUB_DEPARTMENT_SORT_RANKS) as ProductionSubDepartment[]).map((department, index) => [
    department,
    index,
  ]),
) as Record<ProductionSubDepartment, number>;

const UNRANKED_PRODUCTION_SUB_DEPARTMENT_SORT_VALUE = Number.POSITIVE_INFINITY;

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

export function getProductionSubDepartmentSortRank(productionSubDepartment: string | null | undefined) {
  if (!productionSubDepartment || !isValidProductionSubDepartment(productionSubDepartment)) {
    return UNRANKED_PRODUCTION_SUB_DEPARTMENT_SORT_VALUE;
  }
  return PRODUCTION_SUB_DEPARTMENT_SORT_RANKS[productionSubDepartment];
}

export function compareProductionSubDepartments(
  a: string | null | undefined,
  b: string | null | undefined,
) {
  const rankDiff = getProductionSubDepartmentSortRank(a) - getProductionSubDepartmentSortRank(b);
  if (rankDiff !== 0) return rankDiff;

  const indexA =
    a && isValidProductionSubDepartment(a)
      ? PRODUCTION_SUB_DEPARTMENT_SORT_INDEX[a]
      : UNRANKED_PRODUCTION_SUB_DEPARTMENT_SORT_VALUE;
  const indexB =
    b && isValidProductionSubDepartment(b)
      ? PRODUCTION_SUB_DEPARTMENT_SORT_INDEX[b]
      : UNRANKED_PRODUCTION_SUB_DEPARTMENT_SORT_VALUE;

  return indexA - indexB;
}
