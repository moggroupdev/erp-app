"use client";

import type { Dispatch, SetStateAction } from "react";
import { SegmentedControl, TextInput } from "@mantine/core";
import DataSelect from "@/components/ui/data-select";
import DatePickerInput from "@/components/ui/date-picker-input";
import ProtectedLink from "@/components/ui/protected-link";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { useI18n } from "@/lib/i18n/hooks";
import type { CustomerAddress } from "@/types/customer";
import type { DeliveryMode } from "../form-state";

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
  deliveryMode: DeliveryMode;
  setDeliveryMode: Dispatch<SetStateAction<DeliveryMode>>;
  deliveryAddressId: string | null;
  setDeliveryAddressId: Dispatch<SetStateAction<string | null>>;
  setPrefillAddress: Dispatch<SetStateAction<boolean>>;
  addresses: CustomerAddress[];
  addressesLoading: boolean;
  addressLabel: (address: CustomerAddress) => string;
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
  deliveryMode,
  setDeliveryMode,
  deliveryAddressId,
  setDeliveryAddressId,
  setPrefillAddress,
  addresses,
  addressesLoading,
  addressLabel,
  clearStepError,
}: ContractStepProps) {
  const { translate } = useI18n();

  return (
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
        label={translate("Legacy contract number", "رقم العقد الورقي")}
        placeholder={translate("Enter the paper contract number", "أدخل رقم العقد الورقي")}
        required
        radius="md"
      />
      <TextInput
        value={legacyWorkOrderNumber}
        onChange={(event) => {
          setLegacyWorkOrderNumber(event.currentTarget.value);
          clearStepError();
        }}
        label={translate("Legacy work order number", "رقم أمر الشغل الورقي")}
        placeholder={translate("Enter the paper work order number", "أدخل رقم أمر الشغل الورقي")}
        required
        radius="md"
      />

      <DatePickerInput
        value={createdAt}
        onChange={(value) => {
          setCreatedAt(value);
          clearStepError();
        }}
        label={translate("Contract date", "تاريخ العقد")}
        placeholder={translate("Select a date", "اختر تاريخًا")}
        required
      />
      <DatePickerInput
        value={startedAt}
        onChange={(value) => {
          setStartedAt(value);
          clearStepError();
        }}
        label={translate("Work order start", "بداية أمر الشغل")}
        placeholder={translate("Select a date", "اختر تاريخًا")}
        required
      />
      <DatePickerInput
        value={deliveryTime}
        onChange={(value) => {
          setDeliveryTime(value);
          clearStepError();
        }}
        label={translate("Delivery date", "تاريخ التسليم")}
        placeholder={translate("Select a date", "اختر تاريخًا")}
        required
      />

      <div className="flex flex-col gap-3 md:col-span-2">
        <span className="text-sm font-medium text-gray-800">{translate("Delivery location", "موقع التسليم")}</span>
        <SegmentedControl
          value={deliveryMode}
          onChange={(value) => {
            const mode = value as DeliveryMode;
            setDeliveryMode(mode);
            if (mode === "factory") setDeliveryAddressId(null);
            else setPrefillAddress(true);
            clearStepError();
          }}
          data={[
            { value: "address", label: translate("Customer address", "موقع العميل") },
            { value: "factory", label: translate("Factory", "المصنع") },
          ]}
          color="haze"
          radius="md"
          className="max-w-md"
        />
        {deliveryMode === "address" ? (
          customerId ? (
            addressesLoading ? (
              <p className="text-sm text-gray-500">{translate("Loading addresses...", "جاري تحميل العناوين...")}</p>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-gray-600">
                {translate(
                  "This customer has no addresses. Deliver at the factory, or add an address on the customer page.",
                  "لا توجد عناوين لهذا العميل. اختر التسليم في المصنع، أو أضف عنوانًا من صفحة العميل.",
                )}{" "}
                <ProtectedLink
                  permission={PERMISSIONS.READ_CUSTOMERS}
                  href={`/sales/customers/${customerId}`}
                  className="text-haze-700 underline"
                >
                  {translate("Open customer", "فتح العميل")}
                </ProtectedLink>
              </p>
            ) : (
              <DataSelect
                value={deliveryAddressId}
                setValue={(next) => {
                  const resolved = typeof next === "function" ? next(deliveryAddressId) : next;
                  setDeliveryAddressId(resolved);
                  clearStepError();
                }}
                data={addresses.map((address) => ({ value: address.id, label: addressLabel(address) }))}
                label={translate("Delivery address", "عنوان التسليم")}
                placeholder={translate("Choose an address", "اختر عنوانًا")}
                className="max-w-xl"
              />
            )
          ) : (
            <p className="text-sm text-gray-500">{translate("Choose a customer first.", "اختر عميلاً أولاً.")}</p>
          )
        ) : (
          <p className="text-sm text-gray-500">{translate("Fulfillment stays at the factory.", "يتم التنفيذ في المصنع.")}</p>
        )}
      </div>
    </section>
  );
}
