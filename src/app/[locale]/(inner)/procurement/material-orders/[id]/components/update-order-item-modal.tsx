"use client";

import { useEffect, useMemo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, NumberInput, Textarea, TextInput } from "@mantine/core";
import { AlertTriangle, FilePenLine, FileText, Package } from "lucide-react";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import ErrorAlert from "@/components/ui/error-alert";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseOrdersApi from "@/lib/api/material-purchase-orders";
import { queryKeys } from "@/lib/api/query-keys";
import { VAT_PERCENT, VAT_RATE } from "@/lib/constants/global";
import { supportsUnitConversions } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import type { MaterialPurchaseOrderDetailed, MaterialPurchaseOrderItem } from "@/types/material-purchase-order";

export default function UpdateOrderItemModal({
  order,
  item,
  excludeMaterialCodes,
}: {
  order: MaterialPurchaseOrderDetailed;
  item: MaterialPurchaseOrderItem;
  excludeMaterialCodes: string[];
}) {
  const { locale, translate, translation } = useI18n();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const [material, setMaterial] = useState<MaterialWithUnitConversionsSelection | null>(null);
  const [unit, setUnit] = useState<MaterialUnit | null>(null);
  const [quantityOrdered, setQuantityOrdered] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  const {
    data: context,
    isFetching: isContextFetching,
    error: contextError,
    refetch: refetchContext,
  } = useQuery({
    queryKey: [...queryKeys.materialPurchaseOrders.detail(order.id), "item-update-context", item.id],
    queryFn: ({ signal }) =>
      materialPurchaseOrdersApi.getItemUpdateContext({
        privateRequest,
        orderId: order.id,
        itemId: item.id,
        signal,
      }),
    enabled: opened,
  });

  useEffect(() => {
    if (!opened || !context) return;
    setMaterial({
      ...item.material,
      unitConversions: item.material.unitConversions,
    } as MaterialWithUnitConversionsSelection);
    setUnit(context.item.unitOfMeasurementSelected);
    setQuantityOrdered(context.item.quantityOrdered);
    setUnitPrice(context.item.unitPrice);
    setNotes(context.item.notes ?? "");
    setValidationError("");
  }, [opened, context, item.material]);

  const showUnitChoices =
    !!material && supportsUnitConversions(material.materialType) && material.unitConversions.length > 0;

  const isBlocked =
    !!context &&
    (context.receiptLineCount > 1 || (!!context.linkedReceipt && Number(context.linkedReceipt.quantityRejected) > 0));

  const preview = useMemo(() => {
    const qty = quantityOrdered === "" ? 0 : Number(quantityOrdered);
    const price = unitPrice === "" ? 0 : Number(unitPrice);
    const otherSubtotal = order.items
      .filter((row) => row.id !== item.id)
      .reduce((sum, row) => sum + Number(row.quantityOrdered) * Number(row.unitPrice), 0);
    const subtotal = otherSubtotal + qty * price;
    const vat = subtotal * VAT_RATE;
    return { subtotal, vat, grandTotal: subtotal + vat };
  }, [order.items, item.id, quantityOrdered, unitPrice]);

  const updateItem = useMutation({
    mutationFn: () => {
      if (!material || !unit || quantityOrdered === "" || unitPrice === "") {
        throw new Error(translate("Fill all required fields.", "أكمل كل الحقول المطلوبة."));
      }
      return materialPurchaseOrdersApi.updateItem({
        privateRequest,
        orderId: order.id,
        itemId: item.id,
        dto: {
          materialCode: material.code,
          unitOfMeasurementSelected: unit,
          quantityOrdered: Number(quantityOrdered),
          unitPrice: Number(unitPrice),
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseOrders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryTransactions.all }),
      ]);
      handleClose();
    },
  });

  const error = validationError || (updateItem.error ? getErrorMessage(locale, updateItem.error) : "");

  function reset() {
    setMaterial(null);
    setUnit(null);
    setQuantityOrdered("");
    setUnitPrice("");
    setNotes("");
    setValidationError("");
    updateItem.reset();
  }

  function handleClose() {
    close();
    setTimeout(reset, 250);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError("");

    if (isBlocked) {
      setValidationError(
        context?.receiptLineCount && context.receiptLineCount > 1
          ? translate(
              "This order line has more than one receipt and cannot be corrected this way.",
              "هذا البند له أكثر من سند استلام ولا يمكن تصحيحه بهذه الطريقة.",
            )
          : translate(
              "This order line has a rejected receipt quantity and cannot be corrected this way.",
              "هذا البند يحتوي على كمية مرفوضة في الاستلام ولا يمكن تصحيحه بهذه الطريقة.",
            ),
      );
      return;
    }

    if (
      !material ||
      !unit ||
      quantityOrdered === "" ||
      unitPrice === "" ||
      Number(quantityOrdered) <= 0 ||
      Number(unitPrice) <= 0
    ) {
      setValidationError(
        translate(
          "Choose a material, unit, quantity, and unit price greater than zero.",
          "اختر المادة والوحدة وكمية وسعر وحدة أكبر من صفر.",
        ),
      );
      return;
    }

    updateItem.mutate();
  }

  return (
    <>
      <Button
        type="button"
        variant="light"
        color="haze"
        size="compact-xs"
        radius="md"
        leftSection={<FilePenLine size={13} />}
        onClick={open}
      >
        {translate("Correct", "تصحيح")}
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title={translate("Correct order line", "تصحيح بند أمر التوريد")}
        size="lg"
      >
        {isContextFetching ? (
          <LoadingSection message={translate("Loading line details", "جاري تحميل تفاصيل البند")} />
        ) : contextError ? (
          <ErrorSection
            errorTitle={translate("Could not load line details", "تعذر تحميل تفاصيل البند")}
            errorMessage={getErrorMessage(locale, contextError)}
            button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetchContext() }}
          />
        ) : context?.cancelled ? (
          <Alert radius="md" color="clay" variant="light" icon={<AlertTriangle size={16} />}>
            <p className="text-sm">
              {translate("A cancelled purchase order cannot be updated.", "لا يمكن تحديث أمر توريد ملغى.")}
            </p>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {context?.hasSupplierInvoice && (
              <Alert radius="md" color="ochre" variant="light" icon={<AlertTriangle size={16} />}>
                <p className="text-sm">
                  {translate(
                    "This order has a supplier invoice. The invoice totals stay as stored. The order total below may change.",
                    "هذا الأمر مرتبط بفاتورة مورد. تظل إجماليات الفاتورة كما هي مخزنة. قد يتغير إجمالي أمر التوريد أدناه.",
                  )}
                </p>
              </Alert>
            )}

            {context?.receiptLineCount && context.receiptLineCount > 1 ? (
              <Alert radius="md" color="clay" variant="light" icon={<AlertTriangle size={16} />}>
                <p className="text-sm">
                  {translate(
                    "This order line has more than one receipt and cannot be corrected this way.",
                    "هذا البند له أكثر من سند استلام ولا يمكن تصحيحه بهذه الطريقة.",
                  )}
                </p>
              </Alert>
            ) : context?.linkedReceipt && Number(context.linkedReceipt.quantityRejected) > 0 ? (
              <Alert radius="md" color="clay" variant="light" icon={<AlertTriangle size={16} />}>
                <p className="text-sm">
                  {translate(
                    "This order line has a rejected receipt quantity and cannot be corrected this way.",
                    "هذا البند يحتوي على كمية مرفوضة في الاستلام ولا يمكن تصحيحه بهذه الطريقة.",
                  )}
                </p>
              </Alert>
            ) : context?.linkedReceipt ? (
              <div className="rounded-md bg-gray-50 px-4 py-4">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  <div className="flex min-w-0 items-center gap-1.5 text-gray-700">
                    <FileText size={14} className="shrink-0 text-gray-500" />
                    <span className="text-gray-500">{translate("Receipt", "سند الاستلام")}</span>
                    <span className="font-mono font-medium text-gray-900">{context.linkedReceipt.receiptCode}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 text-gray-700">
                    <Package size={14} className="shrink-0 text-gray-500" />
                    <span className="text-gray-500">{translate("Inventory", "إذن الإضافة")}</span>
                    {context.linkedReceipt.inventoryTransactionCode ? (
                      <span className="font-mono font-medium text-gray-900">
                        {context.linkedReceipt.inventoryTransactionCode}
                      </span>
                    ) : (
                      <span className="text-gray-600">{translate("Not posted yet", "لم يُرحَّل بعد")}</span>
                    )}
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-gray-600">
                  {translate(
                    "Accepted quantity on the receipt and inventory line will match the ordered quantity.",
                    "ستطابق الكمية المقبولة في الاستلام وإذن الإضافة الكمية المطلوبة.",
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {translate(
                  "This line has no receipt yet. Only the order line will be updated.",
                  "لا يوجد سند استلام لهذا البند بعد. سيتم تحديث بند أمر التوريد فقط.",
                )}
              </p>
            )}

            <SelectMaterial
              label={translate("Material", "المادة")}
              value={material?.code ?? null}
              setValue={(next) => {
                const resolved = typeof next === "function" ? next(material?.code ?? null) : next;
                if (!resolved) {
                  setMaterial(null);
                  setUnit(null);
                }
              }}
              onMaterialSelect={(next) => {
                setMaterial(next);
                setUnit(next?.unitOfMeasurement ?? null);
              }}
              excludeCodes={excludeMaterialCodes.filter((code) => code !== item.materialCode)}
              placeholder={translate("Search by name or code...", "ابحث بالاسم أو الكود...")}
              withBrowseModal
              required
              disabled={isBlocked || updateItem.isPending}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <NumberInput
                label={translate("Quantity ordered", "الكمية المطلوبة")}
                value={quantityOrdered}
                onChange={(value) => setQuantityOrdered(value === "" ? "" : Number(value))}
                min={0}
                allowNegative={false}
                decimalScale={6}
                hideControls
                radius="md"
                placeholder={translate("Enter quantity", "أدخل الكمية")}
                required
                disabled={isBlocked || updateItem.isPending}
              />
              {showUnitChoices && material ? (
                <DataSelect
                  label={translate("Unit", "الوحدة")}
                  value={unit}
                  setValue={(next) => setUnit((next as MaterialUnit | null) ?? null)}
                  data={getMaterialUnitSelectOptions(material.unitOfMeasurement, material.unitConversions, locale)}
                  placeholder={translate("Select unit", "اختر الوحدة")}
                  searchable
                  required
                  disabled={isBlocked || updateItem.isPending}
                />
              ) : (
                <TextInput
                  label={translate("Unit", "الوحدة")}
                  value={unit ? getMaterialUnitLabel(unit, locale) : ""}
                  placeholder={translate("Select a material first", "اختر المادة أولاً")}
                  readOnly
                  radius="md"
                  required
                  disabled={isBlocked || updateItem.isPending}
                />
              )}
              <NumberInput
                label={translate(`Unit price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                value={unitPrice}
                onChange={(value) => setUnitPrice(value === "" ? "" : Number(value))}
                min={0}
                allowNegative={false}
                decimalScale={6}
                hideControls
                radius="md"
                placeholder={translate("Enter unit price", "أدخل سعر الوحدة")}
                required
                disabled={isBlocked || updateItem.isPending}
              />
            </div>

            <Textarea
              label={translate("Notes", "الملاحظات")}
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              placeholder={translate("Optional note", "ملاحظة اختيارية")}
              radius="md"
              autosize
              minRows={2}
              disabled={isBlocked || updateItem.isPending}
            />

            <div className="rounded-md bg-gray-50 p-4">
              <dl className="grid gap-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-gray-500">
                    {translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`)}
                  </dt>
                  <dd className="font-medium text-gray-800 tabular-nums">{formatMoney(preview.subtotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-gray-500">
                    {translate(`VAT (${VAT_PERCENT}%)`, `ضريبة القيمة المضافة (${VAT_PERCENT}%)`)}
                  </dt>
                  <dd className="font-medium text-gray-800 tabular-nums">{formatMoney(preview.vat)}</dd>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-3 border-t border-gray-200 pt-1.5">
                  <dt className="font-medium text-gray-800">
                    {translate(`Grand total (${translation.currency})`, `الإجمالي الكلي (${translation.currency})`)}
                  </dt>
                  <dd className="font-semibold text-gray-900 tabular-nums">{formatMoney(preview.grandTotal)}</dd>
                </div>
              </dl>
            </div>

            {error && <ErrorAlert error={error} />}

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={handleClose} variant="default" radius="md" disabled={updateItem.isPending}>
                {translation.cancel}
              </Button>
              <Button type="submit" color="haze" radius="md" loading={updateItem.isPending} disabled={isBlocked}>
                {translate("Save correction", "حفظ التصحيح")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
