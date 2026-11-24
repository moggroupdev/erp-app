"use client";

import { useEffect, useMemo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, NumberInput, Textarea, TextInput } from "@mantine/core";
import { Pencil } from "lucide-react";
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
import {
  getMaterialUnitLabel,
  getMaterialUnitSelectOptions,
  type MaterialUnit,
} from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialWithUnitConversionsSelection } from "@/types/material";
import type {
  MaterialPurchaseOrderDetailed,
  MaterialPurchaseOrderItem,
} from "@/types/material-purchase-order";

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

    if (!material || !unit || quantityOrdered === "" || unitPrice === "" || Number(quantityOrdered) <= 0 || Number(unitPrice) <= 0) {
      setValidationError(
        translate(
          "Choose a material, unit, quantity, and unit price greater than zero.",
          "اختر المادة والوحدة وكمية وسعر وحدة أكبر من صفر.",
        ),
      );
      return;
    }

    if (context?.receiptLineCount && context.receiptLineCount > 1) {
      setValidationError(
        translate(
          "This order line has more than one receipt and cannot be corrected this way.",
          "هذا البند له أكثر من سند استلام ولا يمكن تصحيحه بهذه الطريقة.",
        ),
      );
      return;
    }

    if (context?.linkedReceipt && Number(context.linkedReceipt.quantityRejected) > 0) {
      setValidationError(
        translate(
          "This order line has a rejected receipt quantity and cannot be corrected this way.",
          "هذا البند يحتوي على كمية مرفوضة في الاستلام ولا يمكن تصحيحه بهذه الطريقة.",
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
        leftSection={<Pencil size={13} />}
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
          <p className="text-sm text-clay-700">
            {translate("A cancelled purchase order cannot be updated.", "لا يمكن تحديث أمر توريد ملغى.")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {context?.hasSupplierInvoice && (
              <p className="rounded-md bg-ochre-50 px-3 py-2 text-sm text-ochre-700">
                {translate(
                  "This order has a supplier invoice. The invoice totals stay as stored. The order total below may change.",
                  "هذا الأمر مرتبط بفاتورة مورد. تظل إجماليات الفاتورة كما هي مخزنة. قد يتغير إجمالي أمر التوريد أدناه.",
                )}
              </p>
            )}

            {context?.linkedReceipt ? (
              <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <p>
                  {translate("Linked receipt", "سند الاستلام المرتبط")}:{" "}
                  <span className="font-mono font-medium">{context.linkedReceipt.receiptCode}</span>
                </p>
                {context.linkedReceipt.inventoryTransactionCode ? (
                  <p>
                    {translate("Inventory transaction", "إذن الإضافة")}:{" "}
                    <span className="font-mono font-medium">
                      {context.linkedReceipt.inventoryTransactionCode}
                    </span>
                  </p>
                ) : (
                  <p>
                    {translate(
                      "No inventory transaction yet. Only the receipt line will be updated.",
                      "لا يوجد إذن إضافة بعد. سيتم تحديث بند الاستلام فقط.",
                    )}
                  </p>
                )}
                <p>
                  {translate(
                    "Accepted quantity on the receipt and inventory line will be set to the ordered quantity.",
                    "ستُضبط الكمية المقبولة في الاستلام وإذن الإضافة على الكمية المطلوبة.",
                  )}
                </p>
              </div>
            ) : context?.receiptLineCount === 0 ? (
              <p className="text-sm text-gray-600">
                {translate(
                  "This line has no receipt yet. Only the order line will be updated.",
                  "لا يوجد سند استلام لهذا البند بعد. سيتم تحديث بند أمر التوريد فقط.",
                )}
              </p>
            ) : null}

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
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput
                label={translate("Quantity ordered", "الكمية المطلوبة")}
                value={quantityOrdered}
                onChange={(value) => setQuantityOrdered(value === "" ? "" : Number(value))}
                min={0}
                allowNegative={false}
                decimalScale={6}
                hideControls
                radius="md"
                required
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
                />
              ) : (
                <TextInput
                  label={translate("Unit", "الوحدة")}
                  value={unit ? getMaterialUnitLabel(unit, locale) : ""}
                  readOnly
                  radius="md"
                  required
                />
              )}
            </div>

            <NumberInput
              label={translate(`Unit price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
              value={unitPrice}
              onChange={(value) => setUnitPrice(value === "" ? "" : Number(value))}
              min={0}
              allowNegative={false}
              decimalScale={6}
              hideControls
              radius="md"
              required
            />

            <Textarea
              label={translate("Notes", "الملاحظات")}
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              radius="md"
              autosize
              minRows={2}
            />

            <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800">
              <p>
                {translate(`New total (${translation.currency})`, `الإجمالي الجديد (${translation.currency})`)}:{" "}
                <span className="font-semibold">{formatMoney(preview.subtotal)}</span>
              </p>
              <p>
                {translate(`VAT (${VAT_PERCENT}%)`, `ضريبة القيمة المضافة (${VAT_PERCENT}%)`)}:{" "}
                <span className="font-semibold">{formatMoney(preview.vat)}</span>
              </p>
              <p>
                {translate(
                  `New grand total (${translation.currency})`,
                  `الإجمالي الكلي الجديد (${translation.currency})`,
                )}
                : <span className="font-semibold">{formatMoney(preview.grandTotal)}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
                {translation.cancel}
              </Button>
              <Button type="submit" color="haze" radius="md" loading={updateItem.isPending} fullWidth>
                {translate("Save correction", "حفظ التصحيح")}
              </Button>
            </div>

            {error && <ErrorAlert error={error} />}
          </form>
        )}
      </Modal>
    </>
  );
}
