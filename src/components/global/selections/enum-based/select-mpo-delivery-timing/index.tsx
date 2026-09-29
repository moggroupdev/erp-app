import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { MPO_DELIVERY_TIMING_LABELS_LIST } from "@/lib/constants/enums/mpo-delivery-timings";

export type SelectMpoDeliveryTimingProps = Omit<LocalizedSelectProps, "labelsList">;

export default function SelectMpoDeliveryTiming(props: SelectMpoDeliveryTimingProps) {
  return <LocalizedSelect {...props} labelsList={MPO_DELIVERY_TIMING_LABELS_LIST} />;
}
