import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import { MPO_PAYMENT_EVENT_LABELS_LIST } from "@/lib/constants/enums/mpo-payment-events";

export type SelectMpoPaymentEventProps = Omit<LocalizedSelectProps, "labelsList">;

export default function SelectMpoPaymentEvent(props: SelectMpoPaymentEventProps) {
  return <LocalizedSelect {...props} labelsList={MPO_PAYMENT_EVENT_LABELS_LIST} />;
}
