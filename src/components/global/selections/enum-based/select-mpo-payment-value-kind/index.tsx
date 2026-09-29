import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import type { LocalizedLabel } from "@/lib/i18n/types";
import { MPO_PAYMENT_VALUE_KIND_LABELS_LIST, type MpoPaymentValueKind } from "@/lib/constants/enums/mpo-payment-value-kinds";

export type SelectMpoPaymentValueKindProps = Omit<LocalizedSelectProps, "labelsList"> & {
  labelsList?: LocalizedLabel<MpoPaymentValueKind>[];
};

export default function SelectMpoPaymentValueKind({ labelsList, ...props }: SelectMpoPaymentValueKindProps) {
  return <LocalizedSelect {...props} labelsList={labelsList ?? MPO_PAYMENT_VALUE_KIND_LABELS_LIST} />;
}
