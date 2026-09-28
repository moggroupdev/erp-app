import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const MPO_DELIVERY_LOCATION_VALUES = ["our_10th_ramadan_factories", "supplier_warehouses"] as const;

export type MpoDeliveryLocation = (typeof MPO_DELIVERY_LOCATION_VALUES)[number];

export const MPO_DELIVERY_LOCATIONS = Object.fromEntries(
  MPO_DELIVERY_LOCATION_VALUES.map((location) => [location.toUpperCase(), location]),
) as {
  [K in Uppercase<MpoDeliveryLocation>]: Lowercase<K>;
};

export const MPO_DELIVERY_LOCATION_LABELS: LocalizedEntity<MpoDeliveryLocation> = {
  our_10th_ramadan_factories: {
    value: "our_10th_ramadan_factories",
    label: { en: "Our factories in 10th of Ramadan", ar: "مصانعنا بالعاشر من رمضان" },
  },
  supplier_warehouses: {
    value: "supplier_warehouses",
    label: { en: "Your warehouses (supplier)", ar: "مخازنكم (المورد)" },
  },
};

export const MPO_DELIVERY_LOCATION_LABELS_LIST = Object.values(MPO_DELIVERY_LOCATION_LABELS);

export function getMpoDeliveryLocationLabel(location: MpoDeliveryLocation, locale: Locale) {
  const entry = MPO_DELIVERY_LOCATION_LABELS[location];
  if (!entry) return location;
  return translate(locale, entry.label.en, entry.label.ar);
}
