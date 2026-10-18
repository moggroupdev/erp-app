"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button, Loader, SegmentedControl, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Check, Factory, MapPin, MapPinOff, Plus } from "lucide-react";
import DatePickerInput from "@/components/ui/date-picker-input";
import ProtectedLink from "@/components/ui/protected-link";
import AddressModal from "@/components/global/data-modals/address-modal";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";
import useHasPermission from "@/hooks/use-has-permission";
import useLocations from "@/hooks/reference/use-locations";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { EGYPT_COUNTRY_ID } from "@/lib/constants/global";
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
  clearStepError,
}: ContractStepProps) {
  const { translate } = useI18n();
  const { helpers: locationHelpers } = useLocations();
  const canAddAddress = useHasPermission(PERMISSIONS.UPDATE_CUSTOMER);
  const [addressModalOpened, { open: openAddressModal, close: closeAddressModal }] = useDisclosure(false);

  return (
    <div className="flex flex-col gap-4">
      {customerId && canAddAddress ? (
        <AddressModal
          opened={addressModalOpened}
          close={closeAddressModal}
          entityType="customer"
          entityId={customerId}
          isFirstAddress={addresses.length === 0}
          onCreated={(address) => {
            setDeliveryAddressId(address.id);
            clearStepError();
          }}
        />
      ) : null}
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
          label={translate("Legacy contract number", "رقم مراجعة العقد")}
          placeholder={translate("Enter the paper contract number", "أدخل رقم مراجعة العقد")}
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
          label={translate("Contract date", "تاريخ مراجعة العقد")}
          placeholder={translate("Select a date", "اختر تاريخًا")}
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
          required
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{translate("Delivery", "التسليم")}</h2>
            <p className="text-xs text-gray-500">
              {translate("Choose where the order will be fulfilled.", "اختر مكان تنفيذ الطلب.")}
            </p>
          </div>
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
        </div>

        <div className="p-4">
          {deliveryMode === "factory" ? (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200">
                <Factory size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {translate("Factory fulfillment", "التسليم من المصنع")}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {translate("Fulfillment stays at the factory.", "يتم التسليم في المصنع.")}
                </p>
              </div>
            </div>
          ) : !customerId ? (
            <p className="text-sm text-gray-500">{translate("Choose a customer first.", "اختر عميلاً أولاً.")}</p>
          ) : addressesLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader size="sm" color="haze" />
              {translate("Loading addresses...", "جاري تحميل العناوين...")}
            </div>
          ) : addresses.length === 0 ? (
            <div className="border-ochre-200 bg-ochre-50 flex gap-3 rounded-xl border px-4 py-3">
              <div className="bg-ochre-100 text-ochre-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <MapPinOff size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-ochre-800 text-sm font-semibold">
                  {translate("No delivery addresses", "لا توجد عناوين تسليم")}
                </p>
                <p className="text-ochre-700 mt-0.5 text-sm">
                  {canAddAddress
                    ? translate(
                        "This customer has no addresses yet. Add a delivery address to continue.",
                        "لا توجد عناوين لهذا العميل بعد. أضف عنوان تسليم للمتابعة.",
                      )
                    : translate(
                        "This customer has no addresses yet. Add one on the customer page, then come back.",
                        "لا توجد عناوين لهذا العميل بعد. أضف عنوانًا من صفحة العميل ثم عد إلى هنا.",
                      )}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {canAddAddress ? (
                    <Button
                      type="button"
                      color="haze"
                      size="compact-sm"
                      leftSection={<Plus size={14} />}
                      onClick={openAddressModal}
                      className="text-xs!"
                    >
                      {translate("Add address", "إضافة عنوان")}
                    </Button>
                  ) : null}
                  <ProtectedLink
                    permission={PERMISSIONS.READ_CUSTOMERS}
                    href={`/sales/customers/${customerId}`}
                    className="text-ochre-800 inline-flex text-sm font-semibold underline underline-offset-2"
                  >
                    {translate("Open customer page", "فتح ملف العميل")}
                  </ProtectedLink>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                role="radiogroup"
                aria-label={translate("Delivery address", "موقع التسليم")}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {addresses.map((address) => {
                  const selected = deliveryAddressId === address.id;
                  const country = locationHelpers.getCountryById(address.countryId);
                  const governorate = locationHelpers.getGovernorateOfCity(address.cityId);
                  const city = locationHelpers.getCityById(address.cityId);
                  const countryName = country ? translate(country.nameEn, country.nameAr) : null;
                  const governorateName = governorate ? translate(governorate.nameEn, governorate.nameAr) : null;
                  const cityName = city ? translate(city.nameEn, city.nameAr) : null;
                  const headline = cityName || countryName || translate("Address", "عنوان");
                  const locationText = [countryName, governorateName, cityName].filter(Boolean).join(" · ");
                  const isInEgypt = address.countryId === EGYPT_COUNTRY_ID;

                  return (
                    <button
                      key={address.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setDeliveryAddressId(address.id);
                        clearStepError();
                      }}
                      className={[
                        "flex h-full flex-col gap-2.5 rounded-xl border p-3 text-start transition-colors",
                        selected
                          ? "border-haze-600 bg-haze-50 ring-haze-200 ring-1"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              selected ? "bg-haze-100 text-haze-700" : "bg-gray-100 text-gray-500",
                            ].join(" ")}
                          >
                            <MapPin size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{headline}</p>
                            <p className="truncate text-xs text-gray-500">
                              {locationText || translate("Location unavailable", "الموقع غير متاح")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={[
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            selected ? "border-haze-600 bg-haze-600 text-white" : "border-gray-300 bg-white",
                          ].join(" ")}
                        >
                          {selected ? <Check size={12} strokeWidth={3} /> : null}
                        </span>
                      </div>

                      <p
                        className={`my-1 line-clamp-2 text-sm leading-snug ${address.addressLine ? "text-gray-700" : "text-gray-500"}`}
                      >
                        {address.addressLine?.trim() || translate("No details added", "لم تتم إضافة تفاصيل")}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {address.isDefault ? (
                          <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[11px] font-medium text-teal-700">
                            {translate("Default", "افتراضي")}
                          </span>
                        ) : null}
                        <span
                          className={[
                            "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            isInEgypt ? "bg-ochre-100 text-ochre-800" : "bg-haze-100 text-haze-700",
                          ].join(" ")}
                        >
                          {translate(isInEgypt ? "In Egypt" : "Outside Egypt", isInEgypt ? "داخل مصر" : "خارج مصر")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {canAddAddress ? (
                <div>
                  <Button
                    type="button"
                    variant="light"
                    color="haze"
                    size="compact-sm"
                    leftSection={<Plus size={14} />}
                    onClick={openAddressModal}
                    className="text-xs!"
                  >
                    {translate("Add address", "إضافة عنوان")}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
