"use client";

import type { Dispatch, SetStateAction } from "react";
import { TextInput } from "@mantine/core";
import DatePickerInput from "@/components/ui/date-picker-input";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";
import { useI18n } from "@/lib/i18n/hooks";

type ContractStepProps = {
  customerId: string | null;
  selectCustomer: (customer: { id: string; name: string; code: string } | null) => void;
  legacyNumber: string;
  setLegacyNumber: Dispatch<SetStateAction<string>>;
  legacyWorkOrderNumber: string;
  setLegacyWorkOrderNumber: Dispatch<SetStateAction<string>>;
  createdAt: string | null;
  setCreatedAt: Dispatch<SetStateAction<string | null>>;
  startedAt: string | null;
  setStartedAt: Dispatch<SetStateAction<string | null>>;
  deliveryTime: string | null;
  setDeliveryTime: Dispatch<SetStateAction<string | null>>;
  clearStepError: () => void;
};

export default function ContractStep({
  customerId,
  selectCustomer,
  legacyNumber,
  setLegacyNumber,
  legacyWorkOrderNumber,
  setLegacyWorkOrderNumber,
  createdAt,
  setCreatedAt,
  startedAt,
  setStartedAt,
  deliveryTime,
  setDeliveryTime,
  clearStepError,
}: ContractStepProps) {
  const { translate } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SelectCustomer
          value={customerId}
          setValue={(next) => {
            const resolved = typeof next === "function" ? next(customerId) : next;
            if (!resolved) selectCustomer(null);
          }}
          onCustomerSelect={selectCustomer}
          label={translate("Customer", "العميل")}
          placeholder={translate("Search customers", "ابحث عن العملاء")}
          required
        />
        <TextInput
          value={legacyNumber}
          onChange={(event) => {
            setLegacyNumber(event.currentTarget.value);
            clearStepError();
          }}
          label={translate("Legacy contract review number", "رقم مراجعة العقد")}
          placeholder={translate("Enter the paper contract review number", "أدخل رقم مراجعة العقد")}
          required
          radius="md"
        />
        <TextInput
          value={legacyWorkOrderNumber}
          onChange={(event) => {
            setLegacyWorkOrderNumber(event.currentTarget.value);
            clearStepError();
          }}
          label={translate("Legacy work order number", "رقم أمر الشغل")}
          placeholder={translate("Enter the paper work order number", "أدخل رقم أمر الشغل")}
          required
          radius="md"
        />

        <DatePickerInput
          value={createdAt}
          onChange={(value) => {
            setCreatedAt(value);
            clearStepError();
          }}
          label={translate("Contract review date", "تاريخ مراجعة العقد")}
          placeholder={translate("Select a date", "اختر تاريخًا")}
          maxDate={startedAt ?? deliveryTime ?? undefined}
          required
        />
        <DatePickerInput
          value={startedAt}
          onChange={(value) => {
            setStartedAt(value);
            clearStepError();
          }}
          label={translate("Work order start date", "تاريخ بدء أمر الشغل")}
          placeholder={translate("Select a date", "اختر تاريخًا")}
          minDate={createdAt ?? undefined}
          maxDate={deliveryTime ?? undefined}
          required
        />
        <DatePickerInput
          value={deliveryTime}
          onChange={(value) => {
            setDeliveryTime(value);
            clearStepError();
          }}
          label={translate("Delivery planned date", "تاريخ التسليم المخطط")}
          placeholder={translate("Select a date", "اختر تاريخًا")}
          minDate={startedAt ?? createdAt ?? undefined}
          required
        />
      </section>
    </div>
  );
}
