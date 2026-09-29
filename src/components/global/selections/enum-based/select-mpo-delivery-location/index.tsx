import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { MPO_DELIVERY_LOCATION_LABELS_LIST } from "@/lib/constants/enums/mpo-delivery-locations";

export type SelectMpoDeliveryLocationProps = Omit<LocalizedSelectProps, "labelsList">;

export default function SelectMpoDeliveryLocation(props: SelectMpoDeliveryLocationProps) {
  return <LocalizedSelect {...props} labelsList={MPO_DELIVERY_LOCATION_LABELS_LIST} />;
}
