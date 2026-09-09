import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const GENDER_VALUES = ["male", "female"] as const;

export type Gender = (typeof GENDER_VALUES)[number];

export const GENDERS = Object.fromEntries(GENDER_VALUES.map((gender) => [gender.toUpperCase(), gender])) as {
  [K in Uppercase<Gender>]: Lowercase<K>;
};

// ================ Labels ================

export const GENDER_LABELS: LocalizedEntity<Gender> = {
  male: {
    value: "male",
    label: {
      en: "Male",
      ar: "ذكر",
    },
  },
  female: {
    value: "female",
    label: {
      en: "Female",
      ar: "أنثى",
    },
  },
};

export const GENDER_LABELS_LIST = Object.values(GENDER_LABELS);

// ================ Helpers ================

export function getGenderLabel(gender: Gender, locale: Locale) {
  if (!GENDER_LABELS[gender]) {
    console.warn(`Gender \`${gender}\` does not exist in predefined labels.`);
    return gender;
  } else return translate(locale, GENDER_LABELS[gender].label.en, GENDER_LABELS[gender].label.ar);
}

export function isValidGender(gender: string): gender is Gender {
  return GENDER_VALUES.includes(gender as Gender);
}
