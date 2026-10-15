"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Stepper } from "@mantine/core";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import type { SelectableProduct } from "@/components/global/selections/remote-based/select-product";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import useLocations from "@/hooks/reference/use-locations";
import contractsApi from "@/lib/api/contracts";
import customersApi from "@/lib/api/customers";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { CustomerAddress } from "@/types/customer";
import ContractStep from "./steps/contract-step";
import LinesStep from "./steps/lines-step";
import ReviewStep from "./steps/review-step";
import UnitsStep from "./steps/units-step";
import {
  buildLegacyContractDto,
  createEmptyItem,
  defaultDimensionId,
  droppedUnitsHaveContent,
  isImportedSource,
  isItemUntouched,
  type DeliveryMode,
  type ItemDraft,
  unitsForQuantity,
  validateContractStep,
  validateItemsStep,
  validateUnitsStep,
} from "./form-state";

const PAGE_TITLE = { en: "Add Legacy Contract", ar: "إضافة عقد مرحلي" };

export default function Page() {
  const { locale, translate } = useI18n();
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

  function handleSubmit(event: FormEvent) {
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
          <Stepper.Step label={translate("Contract", "العقد")} description={translate("Customer and dates", "العميل والتواريخ")} />
          <Stepper.Step label={translate("Lines", "البنود")} description={translate("Products and prices", "المنتجات والأسعار")} />
          <Stepper.Step label={translate("Units", "الوحدات")} description={translate("Serial numbers", "الأرقام التسلسلية")} />
          <Stepper.Step label={translate("Review", "المراجعة")} description={translate("Confirm and save", "التأكيد والحفظ")} />
        </Stepper>

        {stepError ? <ErrorAlert error={stepError} /> : null}
        {apiError ? <ErrorAlert error={apiError} /> : null}

        {step === 0 ? (
          <ContractStep
            customerId={customerId}
            selectCustomer={selectCustomer}
            legacyNumber={legacyNumber}
            setLegacyNumber={setLegacyNumber}
            legacyWorkOrderNumber={legacyWorkOrderNumber}
            setLegacyWorkOrderNumber={setLegacyWorkOrderNumber}
            createdAt={createdAt}
            setCreatedAt={setCreatedAt}
            startedAt={startedAt}
            setStartedAt={setStartedAt}
            deliveryTime={deliveryTime}
            setDeliveryTime={setDeliveryTime}
            deliveryMode={deliveryMode}
            setDeliveryMode={setDeliveryMode}
            deliveryAddressId={deliveryAddressId}
            setDeliveryAddressId={setDeliveryAddressId}
            setPrefillAddress={setPrefillAddress}
            addresses={addresses}
            addressesLoading={addressesQuery.isFetching}
            addressLabel={addressLabel}
            clearStepError={clearStepError}
          />
        ) : null}

        {step === 1 ? (
          <LinesStep
            items={items}
            setItems={setItems}
            applyProduct={applyProduct}
            updateQuantity={updateQuantity}
            clearStepError={clearStepError}
          />
        ) : null}

        {step === 2 ? (
          <UnitsStep
            items={items}
            setItems={setItems}
            pasteDrafts={pasteDrafts}
            setPasteDrafts={setPasteDrafts}
            pasteNotes={pasteNotes}
            setPasteNotes={setPasteNotes}
            clearStepError={clearStepError}
          />
        ) : null}

        {step === 3 ? (
          <ReviewStep
            customerName={customerName}
            customerCode={customerCode}
            legacyNumber={legacyNumber}
            legacyWorkOrderNumber={legacyWorkOrderNumber}
            createdAt={createdAt}
            startedAt={startedAt}
            deliveryTime={deliveryTime}
            deliveryMode={deliveryMode}
            selectedAddress={selectedAddress}
            addressLabel={addressLabel}
            totalAmount={totalAmount}
            items={items}
          />
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
