"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, NumberInput, SegmentedControl, Stepper, Table, TextInput, Textarea } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import DatePickerInput from "@/components/ui/date-picker-input";
import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import SelectCustomer from "@/components/global/selections/remote-based/select-customer";
import SelectProduct, { type SelectableProduct } from "@/components/global/selections/remote-based/select-product";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import useLocations from "@/hooks/reference/use-locations";
import contractsApi from "@/lib/api/contracts";
import customersApi from "@/lib/api/customers";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatDate } from "@/lib/helpers/date-formaters";
import getErrorMessage from "@/lib/helpers/get-error-message";
import dayjs from "dayjs";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { CustomerAddress } from "@/types/customer";
import {
  applyPastedSerials,
  buildLegacyContractDto,
  createEmptyItem,
  defaultDimensionId,
  droppedUnitsHaveContent,
  isImportedSource,
  isItemUntouched,
  lineTitle,
  selectedDimension,
  type DeliveryMode,
  type ItemDraft,
  unitsForQuantity,
  validateContractStep,
  validateItemsStep,
  validateUnitsStep,
} from "./form-state";

const PAGE_TITLE = { en: "Add Legacy Contract", ar: "إضافة عقد مرحلي" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const href = useLocaleHref();
  const router = useRouter();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const { helpers: locationHelpers } = useLocations();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [legacyNumber, setLegacyNumber] = useState("");
  const [legacyWorkOrderNumber, setLegacyWorkOrderNumber] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("address");
  const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
  const [prefillAddress, setPrefillAddress] = useState(false);
  const [items, setItems] = useState<ItemDraft[]>(() => [createEmptyItem()]);
  const [pasteDrafts, setPasteDrafts] = useState<Record<string, string>>({});
  const [pasteNotes, setPasteNotes] = useState<Record<string, string>>({});

  const addressesQuery = useQuery({
    queryKey: queryKeys.customers.addresses(customerId ?? "none"),
    queryFn: ({ signal }) => customersApi.listAddresses({ privateRequest, id: customerId!, signal }),
    enabled: !!customerId,
    staleTime: staleTimes.customers,
  });
  const addresses = addressesQuery.data ?? [];

  useEffect(() => {
    if (!prefillAddress || deliveryMode !== "address" || !customerId || addressesQuery.isFetching) return;
    const preferred = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
    setDeliveryAddressId(preferred?.id ?? null);
    setPrefillAddress(false);
  }, [prefillAddress, deliveryMode, customerId, addresses, addressesQuery.isFetching]);

  const isDirty = useMemo(() => {
    if (submitted) return false;
    return (
      !!customerId ||
      legacyNumber.trim() !== "" ||
      legacyWorkOrderNumber.trim() !== "" ||
      !!createdAt ||
      !!startedAt ||
      !!deliveryTime ||
      deliveryMode !== "factory" ||
      items.length !== 1 ||
      items.some((item) => !isItemUntouched(item))
    );
  }, [submitted, customerId, legacyNumber, legacyWorkOrderNumber, createdAt, startedAt, deliveryTime, deliveryMode, items]);

  const confirmNavigation = useUnsavedChangesWarning(isDirty);

  const mutation = useMutation({
    mutationFn: () => {
      const dto = buildLegacyContractDto({
        customerId: customerId!,
        legacyNumber,
        legacyWorkOrderNumber,
        createdAt: createdAt!,
        startedAt: startedAt!,
        deliveryTime: deliveryTime!,
        deliveryAddressId: deliveryMode === "address" ? deliveryAddressId : null,
        items,
      });
      return contractsApi.createLegacy({ privateRequest, dto });
    },
    onSuccess: async (created) => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      router.push(href(`/sales/contracts/${created.id}`));
    },
  });

  const apiError = mutation.error ? getErrorMessage(locale, mutation.error) : "";
  const dimensionUnit = translation.productDimensionUnit;

  function clearStepError() {
    setStepError(null);
  }

  function goNext() {
    const error =
      step === 0
        ? validateContractStep(
            {
              customerId,
              legacyNumber,
              legacyWorkOrderNumber,
              createdAt,
              startedAt,
              deliveryTime,
              deliveryMode,
              deliveryAddressId,
            },
            translate,
          )
        : step === 1
          ? validateItemsStep(items, translate)
          : validateUnitsStep(items, translate);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(current + 1, 3));
  }

  function goBack() {
    setStepError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const error =
      validateContractStep(
        {
          customerId,
          legacyNumber,
          legacyWorkOrderNumber,
          createdAt,
          startedAt,
          deliveryTime,
          deliveryMode,
          deliveryAddressId,
        },
        translate,
      ) ||
      validateItemsStep(items, translate) ||
      validateUnitsStep(items, translate);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    mutation.mutate();
  }

  function selectCustomer(customer: { id: string; name: string; code: string } | null) {
    setCustomerId(customer?.id ?? null);
    setCustomerName(customer?.name ?? "");
    setCustomerCode(customer?.code ?? "");
    setDeliveryAddressId(null);
    setPrefillAddress(!!customer);
    clearStepError();
  }

  function applyProduct(key: string, product: SelectableProduct | null) {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        if (!product) {
          return {
            ...createEmptyItem(),
            key: item.key,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            notes: item.notes,
            units: unitsForQuantity(item.units, typeof item.quantity === "number" ? item.quantity : item.units.length),
          };
        }
        const keepTitle = item.title.trim() !== "" && item.title !== item.productTitle;
        return {
          ...item,
          productCode: product.code,
          productTitle: product.title,
          sourceType: product.sourceType,
          dimensions: product.dimensions,
          productDimensionId: defaultDimensionId(product.dimensions),
          title: keepTitle ? item.title : product.title,
          units: isImportedSource(product.sourceType)
            ? item.units
            : item.units.map((unit) => ({ ...unit, supplierSerialNumber: "" })),
        };
      }),
    );
    clearStepError();
  }

  function updateQuantity(key: string, raw: number | string) {
    const item = items.find((row) => row.key === key);
    if (!item) return;
    if (raw === "") {
      setItems((current) => current.map((row) => (row.key === key ? { ...row, quantity: "" } : row)));
      clearStepError();
      return;
    }
    const quantity = Math.trunc(Number(raw));
    if (!Number.isFinite(quantity) || quantity < 1) {
      setItems((current) => current.map((row) => (row.key === key ? { ...row, quantity: "" } : row)));
      clearStepError();
      return;
    }
    if (droppedUnitsHaveContent(item.units, quantity)) {
      const confirmed = window.confirm(
        translate(
          "Reducing the quantity will discard serial numbers already entered. Continue?",
          "تقليل الكمية سيحذف الأرقام التسلسلية المدخلة. هل تريد المتابعة؟",
        ),
      );
      if (!confirmed) return;
    }
    setItems((current) =>
      current.map((row) => (row.key === key ? { ...row, quantity, units: unitsForQuantity(row.units, quantity) } : row)),
    );
    clearStepError();
  }

  function addressLabel(address: CustomerAddress) {
    const city = locationHelpers.getCityById(address.cityId);
    const cityName = city ? (locale === "ar" ? city.nameAr : city.nameEn) : "";
    const line = address.addressLine?.trim() ?? "";
    const label = [line, cityName].filter(Boolean).join(", ") || translate("Address", "عنوان");
    return address.isDefault ? `${label} (${translate("Default", "افتراضي")})` : label;
  }

  const selectedAddress = addresses.find((address) => address.id === deliveryAddressId) ?? null;
  const totalAmount = items.reduce((sum, item) => {
    if (item.unitPrice === "" || item.quantity === "") return sum;
    return sum + Number(item.unitPrice) * Number(item.quantity);
  }, 0);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        confirmNavigate: confirmNavigation,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Stepper
          active={step}
          onStepClick={(next) => {
            if (next < step) {
              setStepError(null);
              setStep(next);
            }
          }}
          color="haze"
          size="sm"
          allowNextStepsSelect={false}
        >
          <Stepper.Step
            label={translate("Contract", "العقد")}
            description={translate("Customer and dates", "العميل والتواريخ")}
          />
          <Stepper.Step
            label={translate("Lines", "البنود")}
            description={translate("Products and prices", "المنتجات والأسعار")}
          />
          <Stepper.Step
            label={translate("Units", "الوحدات")}
            description={translate("Serial numbers", "الأرقام التسلسلية")}
          />
          <Stepper.Step
            label={translate("Review", "المراجعة")}
            description={translate("Confirm and save", "التأكيد والحفظ")}
          />
        </Stepper>

        {stepError ? <ErrorAlert error={stepError} /> : null}
        {apiError ? <ErrorAlert error={apiError} /> : null}

        {step === 0 ? (
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
                  addressesQuery.isFetching ? (
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
                <p className="text-sm text-gray-500">
                  {translate("Fulfillment stays at the factory.", "يتم التنفيذ في المصنع.")}
                </p>
              )}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="flex flex-col gap-4">
            {items.map((item, index) => {
              const dimension = selectedDimension(item);
              return (
                <article key={item.key} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {translate("Line", "البند")} {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="subtle"
                      color="clay"
                      size="compact-sm"
                      leftSection={<Trash2 size={14} />}
                      onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                    >
                      {translate("Remove", "حذف")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <SelectProduct
                      value={item.productCode}
                      setValue={(next) => {
                        const resolved = typeof next === "function" ? next(item.productCode) : next;
                        if (!resolved) applyProduct(item.key, null);
                      }}
                      onProductSelect={(product) => applyProduct(item.key, product)}
                      label={translate("Product", "المنتج")}
                      placeholder={translate("Search products", "ابحث عن المنتجات")}
                      required
                    />
                    <DataSelect
                      value={item.productDimensionId}
                      setValue={(next) => {
                        const resolved = typeof next === "function" ? next(item.productDimensionId) : next;
                        setItems((current) =>
                          current.map((row) => (row.key === item.key ? { ...row, productDimensionId: resolved } : row)),
                        );
                        clearStepError();
                      }}
                      data={item.dimensions.map((option) => ({
                        value: option.id,
                        label: formatDimensionLabelText(option, dimensionUnit),
                      }))}
                      label={translate("Dimension", "المقاس")}
                      placeholder={
                        item.productCode
                          ? translate("Choose a dimension", "اختر مقاسًا")
                          : translate("Choose a product first", "اختر منتجًا أولاً")
                      }
                      disabled={!item.productCode || item.dimensions.length === 0}
                      required
                    />
                    <TextInput
                      value={item.title}
                      onChange={(event) => {
                        const title = event.currentTarget.value;
                        setItems((current) => current.map((row) => (row.key === item.key ? { ...row, title } : row)));
                      }}
                      label={translate("Title", "العنوان")}
                      placeholder={item.productTitle || translate("Line title", "عنوان البند")}
                      radius="md"
                      className="md:col-span-2"
                    />
                    <NumberInput
                      value={item.unitPrice}
                      onChange={(value) => {
                        setItems((current) =>
                          current.map((row) =>
                            row.key === item.key ? { ...row, unitPrice: value === "" ? "" : Number(value) } : row,
                          ),
                        );
                        clearStepError();
                      }}
                      label={translate("Unit price", "سعر الوحدة")}
                      placeholder={translate("Enter unit price", "أدخل سعر الوحدة")}
                      min={0}
                      decimalScale={2}
                      allowNegative={false}
                      hideControls
                      required
                      radius="md"
                    />
                    <NumberInput
                      value={item.quantity}
                      onChange={(value) => updateQuantity(item.key, value)}
                      label={translate("Quantity", "الكمية")}
                      placeholder={translate("Enter quantity", "أدخل الكمية")}
                      min={1}
                      allowDecimal={false}
                      allowNegative={false}
                      required
                      radius="md"
                    />
                    <Textarea
                      value={item.notes}
                      onChange={(event) => {
                        const notes = event.currentTarget.value;
                        setItems((current) => current.map((row) => (row.key === item.key ? { ...row, notes } : row)));
                      }}
                      label={translate("Notes", "ملاحظات")}
                      placeholder={translate("Optional notes", "ملاحظات اختيارية")}
                      radius="md"
                      autosize
                      minRows={2}
                      className="md:col-span-2"
                    />
                  </div>
                  {dimension ? (
                    <p className="text-sm text-gray-500">{formatDimensionLabelText(dimension, dimensionUnit)}</p>
                  ) : null}
                </article>
              );
            })}
            <Button
              type="button"
              variant="light"
              color="haze"
              leftSection={<Plus size={16} />}
              onClick={() => setItems((current) => [...current, createEmptyItem()])}
              className="self-start"
            >
              {translate("Add line", "إضافة بند")}
            </Button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="flex flex-col gap-4">
            {items.map((item, index) => {
              const imported = isImportedSource(item.sourceType);
              const dimension = selectedDimension(item);
              return (
                <article key={item.key} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {translate("Line", "البند")} {index + 1}
                      {lineTitle(item) ? ` · ${lineTitle(item)}` : ""}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {dimension ? formatDimensionLabelText(dimension, dimensionUnit) : item.productCode}
                      {item.quantity !== "" ? ` · ${item.quantity}` : ""}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="w-full table-fixed" verticalSpacing="xs">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th w="8%">#</Table.Th>
                          <Table.Th w={imported ? "34%" : "46%"}>{translate("Serial number", "الرقم التسلسلي")}</Table.Th>
                          {imported ? <Table.Th w="30%">{translate("Supplier serial", "مسلسل المورد")}</Table.Th> : null}
                          <Table.Th w={imported ? "28%" : "46%"}>{translate("Produced", "الإنتاج")}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {item.units.map((unit, unitIndex) => (
                          <Table.Tr key={unit.key}>
                            <Table.Td className="text-gray-500">{unitIndex + 1}</Table.Td>
                            <Table.Td>
                              <TextInput
                                value={unit.serialNumber}
                                onChange={(event) => {
                                  const serialNumber = event.currentTarget.value.replace(/\D/g, "").slice(0, 12);
                                  setItems((current) =>
                                    current.map((row) =>
                                      row.key === item.key
                                        ? {
                                            ...row,
                                            units: row.units.map((entry) =>
                                              entry.key === unit.key ? { ...entry, serialNumber } : entry,
                                            ),
                                          }
                                        : row,
                                    ),
                                  );
                                  clearStepError();
                                }}
                                placeholder="000000000000"
                                maxLength={12}
                                inputMode="numeric"
                                radius="md"
                                required
                              />
                            </Table.Td>
                            {imported ? (
                              <Table.Td>
                                <TextInput
                                  value={unit.supplierSerialNumber}
                                  onChange={(event) => {
                                    const supplierSerialNumber = event.currentTarget.value;
                                    setItems((current) =>
                                      current.map((row) =>
                                        row.key === item.key
                                          ? {
                                              ...row,
                                              units: row.units.map((entry) =>
                                                entry.key === unit.key ? { ...entry, supplierSerialNumber } : entry,
                                              ),
                                            }
                                          : row,
                                      ),
                                    );
                                    clearStepError();
                                  }}
                                  placeholder={translate("Supplier serial", "مسلسل المورد")}
                                  radius="md"
                                  required
                                />
                              </Table.Td>
                            ) : null}
                            <Table.Td>
                              <DatePickerInput
                                value={unit.producedAt}
                                onChange={(value) => {
                                  setItems((current) =>
                                    current.map((row) =>
                                      row.key === item.key
                                        ? {
                                            ...row,
                                            units: row.units.map((entry) =>
                                              entry.key === unit.key ? { ...entry, producedAt: value } : entry,
                                            ),
                                          }
                                        : row,
                                    ),
                                  );
                                }}
                                placeholder={translate("Optional", "اختياري")}
                                clearable
                              />
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-end">
                    <Textarea
                      value={pasteDrafts[item.key] ?? ""}
                      onChange={(event) =>
                        setPasteDrafts((current) => ({ ...current, [item.key]: event.currentTarget.value }))
                      }
                      label={translate("Paste serials", "لصق الأرقام التسلسلية")}
                      placeholder={translate("One 12-digit serial per line", "رقم تسلسلي من 12 رقمًا في كل سطر")}
                      autosize
                      minRows={2}
                      radius="md"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="light"
                      color="haze"
                      onClick={() => {
                        const result = applyPastedSerials(item, pasteDrafts[item.key] ?? "");
                        setItems((current) => current.map((row) => (row.key === item.key ? result.item : row)));
                        setPasteNotes((current) => ({
                          ...current,
                          [item.key]:
                            result.extra > 0
                              ? translate(
                                  `${result.extra} extra serials were ignored.`,
                                  `تم تجاهل ${result.extra} أرقام زائدة.`,
                                )
                              : "",
                        }));
                        clearStepError();
                      }}
                    >
                      {translate("Fill serials", "تعبئة الأرقام")}
                    </Button>
                  </div>
                  {pasteNotes[item.key] ? <p className="text-sm text-gray-500">{pasteNotes[item.key]}</p> : null}
                </article>
              );
            })}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-2">
              <SummaryItem
                label={translate("Customer", "العميل")}
                value={customerName ? `${customerName} - ${customerCode}` : ""}
              />
              <SummaryItem label={translate("Legacy contract number", "رقم العقد الورقي")} value={legacyNumber.trim()} />
              <SummaryItem
                label={translate("Legacy work order number", "رقم أمر الشغل الورقي")}
                value={legacyWorkOrderNumber.trim()}
              />
              <SummaryItem label={translate("Contract date", "تاريخ العقد")} value={formatPickerDate(createdAt, locale)} />
              <SummaryItem
                label={translate("Work order start", "بداية أمر الشغل")}
                value={formatPickerDate(startedAt, locale)}
              />
              <SummaryItem
                label={translate("Delivery date", "تاريخ التسليم")}
                value={formatPickerDate(deliveryTime, locale)}
              />
              <SummaryItem
                label={translate("Delivery", "التسليم")}
                value={
                  deliveryMode === "factory"
                    ? translate("Factory", "المصنع")
                    : selectedAddress
                      ? addressLabel(selectedAddress)
                      : ""
                }
              />
              <SummaryItem label={translate("Total", "الإجمالي")} value={formatMoney(totalAmount)} />
            </div>
            {items.map((item, index) => {
              const dimension = selectedDimension(item);
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.unitPrice) || 0;
              const produced = item.units.filter((unit) => unit.producedAt).length;
              return (
                <article key={item.key} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {index + 1}. {lineTitle(item) || translate("Untitled line", "بند بدون عنوان")}
                    </h3>
                    <span className="text-sm text-gray-600">{formatMoney(quantity * price)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.productCode}
                    {dimension ? ` · ${formatDimensionLabelText(dimension, dimensionUnit)}` : ""}
                    {` · ${quantity} × ${formatMoney(price)}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {translate(`${item.units.length} units`, `${item.units.length} وحدات`)}
                    {produced > 0
                      ? ` · ${translate(`${produced} produced`, `${produced} تم إنتاجها`)}`
                      : ` · ${translate("None marked produced", "لم يُحدد إنتاج")}`}
                  </p>
                  {item.notes.trim() ? <p className="mt-2 text-sm text-gray-700">{item.notes.trim()}</p> : null}
                </article>
              );
            })}
          </section>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="default" onClick={goBack}>
              {translate("Back", "رجوع")}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" color="haze" onClick={goNext}>
              {translate("Next", "التالي")}
            </Button>
          ) : (
            <Button type="submit" color="haze" loading={mutation.isPending}>
              {translate("Create legacy contract", "إنشاء العقد المرحلي")}
            </Button>
          )}
        </div>
      </form>
    </LayoutBox>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "-"}</p>
    </div>
  );
}

function formatPickerDate(value: string | null, locale: "en" | "ar") {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? formatDate(parsed.toDate(), locale) : "";
}
