"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@mantine/core";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import type { SelectableProduct } from "@/components/global/selections/remote-based/select-product";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import contractsApi from "@/lib/api/contracts";
import { queryKeys } from "@/lib/api/query-keys";
import { dateOnlyToTwoPmIso } from "@/lib/helpers/datetime-picker";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import CreateStepper from "./create-stepper";
import ContractStep from "./steps/contract-step";
import LinesStep from "./steps/lines-step";
import ReviewStep from "./steps/review-step";
import UnitsStep from "./steps/units-step";
import {
  buildLegacyContractDto,
  createEmptyItem,
  droppedUnitsHaveContent,
  getMaxReachableLegacyStep,
  isImportedSource,
  isItemUntouched,
  type ItemDraft,
  unitsForQuantity,
  validateContractStep,
  validateItemsStep,
  validateUnitsStep,
} from "./form-state";

const PAGE_TITLE = { en: "Add Legacy Contract Review", ar: "إضافة مراجعة عقد مرحلية" };

export default function Page() {
  const { locale, translate } = useI18n();
  const href = useLocaleHref();
  const router = useRouter();
  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [stepValidating, setStepValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [legacyNumber, setLegacyNumber] = useState("");
  const [legacyWorkOrderNumber, setLegacyWorkOrderNumber] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [items, setItems] = useState<ItemDraft[]>(() => [createEmptyItem()]);

  const isDirty = useMemo(() => {
    if (submitted) return false;
    return (
      !!customerId ||
      legacyNumber.trim() !== "" ||
      legacyWorkOrderNumber.trim() !== "" ||
      !!createdAt ||
      !!startedAt ||
      !!deliveryTime ||
      items.length !== 1 ||
      items.some((item) => !isItemUntouched(item))
    );
  }, [submitted, customerId, legacyNumber, legacyWorkOrderNumber, createdAt, startedAt, deliveryTime, items]);

  const confirmNavigation = useUnsavedChangesWarning(isDirty);

  const contractInput = {
    customerId,
    legacyNumber,
    legacyWorkOrderNumber,
    createdAt,
    startedAt,
    deliveryTime,
  };

  const maxReachable = useMemo(
    () =>
      getMaxReachableLegacyStep(
        { customerId, legacyNumber, legacyWorkOrderNumber, createdAt, startedAt, deliveryTime },
        items,
      ),
    [customerId, legacyNumber, legacyWorkOrderNumber, createdAt, startedAt, deliveryTime, items],
  );

  const mutation = useMutation({
    mutationFn: () => {
      const dto = buildLegacyContractDto({
        customerId: customerId!,
        legacyNumber,
        legacyWorkOrderNumber,
        createdAt: createdAt!,
        startedAt: startedAt!,
        deliveryTime: deliveryTime!,
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

  function contractHeaderDto() {
    return {
      customerId: customerId!,
      legacyNumber: legacyNumber.trim(),
      legacyWorkOrderNumber: legacyWorkOrderNumber.trim(),
      createdAt: dateOnlyToTwoPmIso(createdAt)!,
      startedAt: dateOnlyToTwoPmIso(startedAt)!,
      deliveryTime: dateOnlyToTwoPmIso(deliveryTime)!,
    };
  }

  function clientErrorForStep(index: number) {
    if (index === 0) return validateContractStep(contractInput, translate);
    if (index === 1) return validateItemsStep(items, translate);
    if (index === 2) return validateUnitsStep(items, translate);
    return null;
  }

  async function apiValidateStep(index: number) {
    if (index === 0) {
      await contractsApi.validateLegacyContract({ privateRequest, dto: contractHeaderDto() });
      return;
    }
    if (index === 1) {
      await contractsApi.validateLegacyItems({
        privateRequest,
        dto: { items: items.map((item) => ({ productDimensionId: item.productDimensionId! })) },
      });
      return;
    }
    if (index === 2) {
      await contractsApi.validateLegacyUnits({
        privateRequest,
        dto: { items: buildLegacyContractDto({ ...contractHeaderDto(), items }).items },
      });
    }
  }

  async function goToStep(target: number) {
    if (stepValidating || mutation.isPending) return;
    if (target === step || target < 0 || target > 3) return;
    if (target > maxReachable) return;

    if (target < step) {
      setStepError(null);
      setStep(target);
      return;
    }

    setStepError(null);
    setStepValidating(true);
    try {
      for (let index = step; index < target; index++) {
        const error = clientErrorForStep(index);
        if (error) {
          setStepError(error);
          setStep(index);
          return;
        }
        try {
          await apiValidateStep(index);
        } catch (apiError) {
          setStepError(getErrorMessage(locale, apiError));
          setStep(index);
          return;
        }
      }
      setStep(target);
    } finally {
      setStepValidating(false);
    }
  }

  function goNext() {
    void goToStep(step + 1);
  }

  function goBack() {
    if (stepValidating) return;
    setStepError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  function createContract() {
    if (stepValidating || mutation.isPending) return;
    const error =
      validateContractStep(contractInput, translate) ||
      validateItemsStep(items, translate) ||
      validateUnitsStep(items, translate);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    mutation.mutate();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Enter in fields triggers implicit form submit. Advance earlier steps;
    // never create from onSubmit (Next→Create button swap can also fire this).
    if (step < 3) void goNext();
  }

  function selectCustomer(customer: { id: string; name: string; code: string } | null) {
    setCustomerId(customer?.id ?? null);
    setCustomerName(customer?.name ?? "");
    setCustomerCode(customer?.code ?? "");
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
          productDimensionId: null,
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

  const totalAmount = items.some((item) => item.unitPrice === "")
    ? null
    : items.reduce((sum, item) => {
        if (item.quantity === "") return sum;
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
        <CreateStepper
          active={step}
          maxReachable={maxReachable}
          validating={stepValidating}
          onStepClick={(next) => void goToStep(next)}
        />

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
          <UnitsStep items={items} setItems={setItems} clearStepError={clearStepError} />
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
            totalAmount={totalAmount}
            items={items}
          />
        ) : null}

        {stepError ? <ErrorAlert error={stepError} /> : null}
        {apiError ? <ErrorAlert error={apiError} /> : null}

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
          {step > 0 ? (
            <Button type="button" variant="light" color="dark" disabled={stepValidating} onClick={goBack}>
              {translate("Back", "رجوع")}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button
              key="next"
              type="button"
              color="haze"
              loading={stepValidating}
              onClick={() => void goNext()}
            >
              {translate("Next", "التالي")}
            </Button>
          ) : (
            <Button
              key="create"
              type="button"
              color="haze"
              loading={mutation.isPending}
              onClick={createContract}
            >
              {translate("Create legacy contract review", "إنشاء مراجعة العقد المرحلية")}
            </Button>
          )}
        </div>
      </form>
    </LayoutBox>
  );
}
