import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MPO_DELIVERY_TIMING_VALUES = ["immediate", "within_days"] as const;

export type MpoDeliveryTiming = (typeof MPO_DELIVERY_TIMING_VALUES)[number];

export const MPO_DELIVERY_TIMINGS = Object.fromEntries(
  MPO_DELIVERY_TIMING_VALUES.map((timing) => [timing.toUpperCase(), timing]),
) as {
  [K in Uppercase<MpoDeliveryTiming>]: Lowercase<K>;
};

export const MPO_DELIVERY_TIMING_LABELS: LocalizedEntity<MpoDeliveryTiming> = {
  immediate: {
    value: "immediate",
    label: { en: "Immediately", ar: "فوراً" },
  },
  within_days: {
    value: "within_days",
    label: { en: "Within days", ar: "خلال أيام" },
  },
};

export const MPO_DELIVERY_TIMING_LABELS_LIST = Object.values(MPO_DELIVERY_TIMING_LABELS);

export function getMpoDeliveryTimingLabel(timing: MpoDeliveryTiming, locale: Locale) {
  const entry = MPO_DELIVERY_TIMING_LABELS[timing];
  if (!entry) return timing;
  return translate(locale, entry.label.en, entry.label.ar);
}
