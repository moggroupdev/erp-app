"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Badge, Button, NumberInput, Table, Textarea, TextInput } from "@mantine/core";
import { CheckCircle2, ClipboardCheck, Package } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseOrdersApi from "@/lib/api/material-purchase-orders";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { isRawMaterial } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { resolveDisplayUnit, toBaseQuantity, toDisplayQuantity } from "@/lib/helpers/unit-conversion";
import type { MaterialPurchaseOrderItem } from "@/types/material-purchase-order";
import type { MaterialUnitConversionSummary } from "@/types/material";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PermissionGuard from "@/components/guards/permission";

const PAGE_TITLE = { en: "Create Materials Receipt", ar: "إنشاء سند استلام خامات" };
const REMAINING_EPSILON = 1e-9;

const UNSTYLED_INPUT_STYLES = { input: { minHeight: 0, height: "auto", padding: 0 } } as const;

type ReceiptDraftRow = {
  orderItemId: string;
  materialCode: string;
  materialTitle: string;
  materialType: MaterialPurchaseOrderItem["material"]["materialType"];
  baseUnit: MaterialUnit;
  unitConversions: MaterialUnitConversionSummary[];
  orderUnit: MaterialUnit;
  remainingInOrderUnit: number;
  unitOfMeasurementSelected: MaterialUnit;
  quantityReceived: number | "";
  quantityRejected: number | "";
  inspectionNotes: string;
  fullyReceived: boolean;
};

function remainingInUnit(
  remainingInOrderUnit: number,
  orderUnit: MaterialUnit,
  selectedUnit: MaterialUnit,
  item: Pick<ReceiptDraftRow, "baseUnit" | "unitConversions">,
) {
  const fromBase = resolveDisplayUnit(orderUnit, item.baseUnit, item.unitConversions).factor;
  const toBase = resolveDisplayUnit(selectedUnit, item.baseUnit, item.unitConversions).factor;
  const remainingBase = toBaseQuantity(remainingInOrderUnit, fromBase);
  return toDisplayQuantity(remainingBase, toBase);
}

function formatQty(value: number, locale: Locale) {
  return value.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 6 });
}

function buildRows(items: MaterialPurchaseOrderItem[]): ReceiptDraftRow[] {
  return items.map((item) => {
    const remaining = Math.max(0, Number(item.quantityRemaining ?? item.quantityOrdered));
    const fullyReceived = remaining <= REMAINING_EPSILON;

    return {
      orderItemId: item.id,
      materialCode: item.material.code,
      materialTitle: item.material.title,
      materialType: item.material.materialType,
      baseUnit: item.material.unitOfMeasurement,
      unitConversions: item.material.unitConversions,
      orderUnit: item.unitOfMeasurementSelected,
      remainingInOrderUnit: remaining,
      unitOfMeasurementSelected: item.unitOfMeasurementSelected,
      quantityReceived: "",
      quantityRejected: "",
      inspectionNotes: "",
      fullyReceived,
    };
  });
}

function showUnitSelect(row: ReceiptDraftRow) {
  return isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function getRowUnitOptions(row: ReceiptDraftRow, locale: Locale) {
  return getMaterialUnitSelectOptions(row.baseUnit, row.unitConversions, locale);
}

function ReceiptItemRow({
  row,
  locale,
  onUpdate,
}: {
  row: ReceiptDraftRow;
  locale: Locale;
  onUpdate: (orderItemId: string, patch: Partial<ReceiptDraftRow>) => void;
}) {
  const { translate } = useI18n();
  const remaining = remainingInUnit(row.remainingInOrderUnit, row.orderUnit, row.unitOfMeasurementSelected, row);
  const unitOptions = getRowUnitOptions(row, locale);

  return (
    <Table.Tr className={row.fullyReceived ? "bg-emerald-50/40 text-gray-500" : "text-gray-700"}>
      <Table.Td className="min-w-56 font-semibold text-gray-800">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={row.fullyReceived ? "text-gray-500" : "text-gray-800"}>{row.materialTitle}</span>
            {row.fullyReceived && (
              <Badge size="xs" variant="light" color="teal" leftSection={<CheckCircle2 size={11} />} className="normal-case">
                {translate("Fully received", "مستلم بالكامل")}
              </Badge>
            )}
          </div>
          <span className="font-mono text-xs font-normal text-gray-500">{row.materialCode}</span>
        </div>
      </Table.Td>
      <Table.Td className={row.fullyReceived ? undefined : "transition-colors focus-within:bg-teal-50/60"}>
        {showUnitSelect(row) && !row.fullyReceived ? (
          <DataSelect
            value={row.unitOfMeasurementSelected}
            setValue={(value) => {
              const nextUnit = (
                typeof value === "function" ? value(row.unitOfMeasurementSelected) : value
              ) as MaterialUnit | null;
              if (!nextUnit || nextUnit === row.unitOfMeasurementSelected) return;

              const prevRemaining = remainingInUnit(
                row.remainingInOrderUnit,
                row.orderUnit,
                row.unitOfMeasurementSelected,
                row,
              );
              const nextRemaining = remainingInUnit(row.remainingInOrderUnit, row.orderUnit, nextUnit, row);
              const received = typeof row.quantityReceived === "number" ? row.quantityReceived : 0;
              const rejected = typeof row.quantityRejected === "number" ? row.quantityRejected : 0;
              const scale = prevRemaining === 0 ? 1 : nextRemaining / prevRemaining;

              onUpdate(row.orderItemId, {
                unitOfMeasurementSelected: nextUnit,
                quantityReceived: row.quantityReceived === "" ? "" : Math.min(received * scale, nextRemaining),
                quantityRejected: row.quantityRejected === "" ? "" : rejected * scale,
              });
            }}
            data={unitOptions}
            variant="unstyled"
            radius={0}
            searchable
            allowDeselect={false}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
          />
        ) : (
          <span className="text-sm text-gray-600">{getMaterialUnitLabel(row.unitOfMeasurementSelected, locale)}</span>
        )}
      </Table.Td>
      <Table.Td>
        <span className={`text-sm tabular-nums ${row.fullyReceived ? "text-gray-400" : "font-medium text-gray-700"}`}>
          {formatQty(remaining, locale)}
        </span>
      </Table.Td>
      <Table.Td className={row.fullyReceived ? undefined : "transition-colors focus-within:bg-teal-50/60"}>
        {row.fullyReceived ? (
          <span className="text-sm text-gray-400">—</span>
        ) : (
          <NumberInput
            value={row.quantityReceived}
            onChange={(value) => onUpdate(row.orderItemId, { quantityReceived: value === "" ? "" : Number(value) })}
            min={0}
            max={remaining}
            allowNegative={false}
            decimalScale={6}
            hideControls
            variant="unstyled"
            radius={0}
            placeholder={translate("Enter quantity", "أدخل الكمية")}
            styles={UNSTYLED_INPUT_STYLES}
          />
        )}
      </Table.Td>
      <Table.Td className={row.fullyReceived ? undefined : "transition-colors focus-within:bg-teal-50/60"}>
        {row.fullyReceived ? (
          <span className="text-sm text-gray-400">—</span>
        ) : (
          <NumberInput
            value={row.quantityRejected}
            onChange={(value) => onUpdate(row.orderItemId, { quantityRejected: value === "" ? "" : Number(value) })}
            min={0}
            max={remaining}
            allowNegative={false}
            decimalScale={6}
            hideControls
            variant="unstyled"
            radius={0}
            placeholder={translate("Enter quantity", "أدخل الكمية")}
            styles={UNSTYLED_INPUT_STYLES}
          />
        )}
      </Table.Td>
      <Table.Td className={row.fullyReceived ? undefined : "transition-colors focus-within:bg-teal-50/60"}>
        {row.fullyReceived ? (
          <span className="text-sm text-gray-400">—</span>
        ) : (
          <TextInput
            value={row.inspectionNotes}
            onChange={(e) => onUpdate(row.orderItemId, { inspectionNotes: e.target.value })}
            placeholder={translate("Optional", "اختياري")}
            variant="unstyled"
            radius={0}
            styles={UNSTYLED_INPUT_STYLES}
          />
        )}
      </Table.Td>
    </Table.Tr>
  );
}

export default function Page() {
  return (
    <PermissionGuard permission={PERMISSIONS.ADD_MATERIAL_PURCHASE_RECEIPT} isForPage>
      <CreateReceiptPage />
    </PermissionGuard>
  );
}

function CreateReceiptPage() {
  const { locale, translate, translation } = useI18n();
  const { id: orderId } = useParams<{ id: string }>();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ReceiptDraftRow[]>([]);
  const [rowsInitialized, setRowsInitialized] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  useDocumentTitle(
    `${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Material Purchase Orders", "أوامر توريد الخامات")}`,
  );

  const {
    data: order,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseOrders.detail(orderId),
    queryFn: ({ signal }) => materialPurchaseOrdersApi.getOrder({ privateRequest, id: orderId, signal }),
    staleTime: staleTimes.materialPurchaseOrders,
  });

  useEffect(() => {
    if (!order || rowsInitialized) return;
    setRows(buildRows(order.items));
    setRowsInitialized(true);
  }, [order, rowsInitialized]);

  const mutation = useMutation({
    mutationFn: async () => {
      const items = rows
        .filter((row) => !row.fullyReceived)
        .map((row) => ({
          materialPurchaseOrderItemId: row.orderItemId,
          unitOfMeasurementSelected: row.unitOfMeasurementSelected,
          quantityReceived: Number(row.quantityReceived) || 0,
          quantityRejected: Number(row.quantityRejected) || 0,
          inspectionNotes: row.inspectionNotes.trim() || null,
        }))
        .filter((item) => item.quantityReceived + item.quantityRejected > 0);

      return await materialPurchaseOrdersApi.createReceipt({
        privateRequest,
        dto: {
          materialPurchaseOrderId: orderId,
          notes: notes.trim() || null,
          items,
        },
      });
    },
    onSuccess: async (created) => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseOrders.all });
      router.push(getLocalizedHref(`/procurement/material-orders/${orderId}/receipts/${created.id}`));
    },
  });

  const errorMessage = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  const isDirty = useMemo(
    () =>
      notes.trim() !== "" ||
      rows.some(
        (row) =>
          !row.fullyReceived &&
          (row.quantityReceived !== "" ||
            row.quantityRejected !== "" ||
            row.inspectionNotes.trim() !== "" ||
            row.unitOfMeasurementSelected !== row.orderUnit),
      ),
    [notes, rows],
  );

  const confirmNavigation = useUnsavedChangesWarning(isDirty && !submitted);

  const openLines = rows.filter((row) => !row.fullyReceived);
  const completedCount = rows.length - openLines.length;
  const hasOpenLines = openLines.length > 0;

  const linesToSubmit = useMemo(
    () =>
      openLines.filter((row) => {
        const received = Number(row.quantityReceived) || 0;
        const rejected = Number(row.quantityRejected) || 0;
        return received + rejected > 0;
      }),
    [openLines],
  );

  const confirmSummary = useMemo(() => {
    let receivedLines = 0;
    let rejectedLines = 0;

    for (const row of linesToSubmit) {
      if ((Number(row.quantityReceived) || 0) > 0) receivedLines += 1;
      if ((Number(row.quantityRejected) || 0) > 0) rejectedLines += 1;
    }

    return { lineCount: linesToSubmit.length, receivedLines, rejectedLines };
  }, [linesToSubmit]);

  function updateRow(orderItemId: string, patch: Partial<ReceiptDraftRow>) {
    setRows((prev) => prev.map((row) => (row.orderItemId === orderItemId ? { ...row, ...patch } : row)));
    setValidationError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (order?.cancelledAt) {
      return setValidationError(
        translate("Cannot add a receipt to a cancelled purchase order.", "لا يمكن إضافة سند استلام إلى أمر توريد ملغي."),
      );
    }

    if (!hasOpenLines) {
      return setValidationError(
        translate("All order lines are already fully received.", "كل بنود أمر التوريد مستلمة بالكامل."),
      );
    }

    let hasPositiveLine = false;

    for (const row of openLines) {
      const received = Number(row.quantityReceived) || 0;
      const rejected = Number(row.quantityRejected) || 0;
      const remaining = remainingInUnit(row.remainingInOrderUnit, row.orderUnit, row.unitOfMeasurementSelected, row);

      if (received < 0 || rejected < 0) {
        return setValidationError(
          translate(
            `Quantities for material ${row.materialTitle} cannot be negative.`,
            `كميات المادة ${row.materialTitle} لا يمكن أن تكون سالبة.`,
          ),
        );
      }

      if (received + rejected > remaining + REMAINING_EPSILON) {
        return setValidationError(
          translate(
            `Received and rejected quantities for material ${row.materialTitle} exceed the remaining quantity.`,
            `الكميات المستلمة والمرفوضة للمادة ${row.materialTitle} تتجاوز الكمية المتبقية.`,
          ),
        );
      }

      if (received + rejected > 0) hasPositiveLine = true;
    }

    if (!hasPositiveLine) {
      return setValidationError(
        translate(
          "At least one receipt line must have a received or rejected quantity greater than zero.",
          "يجب أن يحتوي بند واحد على الأقل على كمية مستلمة أو مرفوضة أكبر من صفر.",
        ),
      );
    }

    mutation.reset();
    openConfirm();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref(`/procurement/material-orders/${orderId}`),
        confirmNavigate: confirmNavigation,
      }}
    >
      {isFetching && !order ? (
        <LoadingSection message={translate("Loading purchase order data", "جاري تحميل بيانات أمر التوريد")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate(
            "An error occurred while loading purchase order data",
            "حدث خطأ أثناء تحميل بيانات أمر التوريد",
          )}
          errorMessage={getErrorMessage(locale, error)}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
        />
      ) : order?.cancelledAt ? (
        <EmptySection
          message={translate(
            "Cannot add a receipt to a cancelled purchase order.",
            "لا يمكن إضافة سند استلام إلى أمر توريد ملغي.",
          )}
        />
      ) : !hasOpenLines && rowsInitialized ? (
        <EmptySection
          message={translate("All order lines are already fully received.", "كل بنود أمر التوريد مستلمة بالكامل.")}
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput value={order?.code ?? ""} label={translate("Purchase Order", "أمر التوريد")} radius="md" readOnly />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              label={translate("Notes", "الملاحظات")}
              placeholder={translate("Optional", "اختياري")}
              radius="md"
              autosize
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{translate(`${openLines.length} open`, `${openLines.length} مفتوح`)}</span>
                {completedCount > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-teal-700">
                      {translate(`${completedCount} fully received`, `${completedCount} مستلم بالكامل`)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
                <Table.Thead className="bg-gray-50">
                  <Table.Tr className="h-9">
                    <Table.Th className="w-[30%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Material", "المادة")}
                    </Table.Th>
                    <Table.Th className="w-[12%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Unit", "الوحدة")}
                    </Table.Th>
                    <Table.Th className="w-[12%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Remaining", "المتبقي")}
                    </Table.Th>
                    <Table.Th className="w-[14%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Quantity Received", "الكمية المستلمة")}
                    </Table.Th>
                    <Table.Th className="w-[14%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Quantity Rejected", "الكمية المرفوضة")}
                    </Table.Th>
                    <Table.Th className="w-[18%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Inspection Notes", "ملاحظات الفحص")}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((row) => (
                    <ReceiptItemRow key={row.orderItemId} row={row} locale={locale} onUpdate={updateRow} />
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </section>

          {errorMessage && <ErrorAlert error={errorMessage} />}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="light"
              color="dark"
              radius="md"
              onClick={() => {
                if (confirmNavigation()) router.push(getLocalizedHref(`/procurement/material-orders/${orderId}`));
              }}
            >
              {translation.cancel}
            </Button>
            <Button type="submit" color="teal" radius="md" disabled={!hasOpenLines || mutation.isPending}>
              {translate("Create receipt", "إنشاء سند الاستلام")}
            </Button>
          </div>
        </form>
      )}

      <Modal
        opened={confirmOpened}
        onClose={() => {
          if (!mutation.isPending) closeConfirm();
        }}
        title={translate("Confirm create receipt", "تأكيد إنشاء سند الاستلام")}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-teal-50/70 px-3.5 py-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <ClipboardCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {translate("Create this materials receipt?", "إنشاء سند الاستلام هذا؟")}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {translate(
                  "Accepted and rejected quantities will be recorded against the purchase order lines.",
                  "سيتم تسجيل الكميات المقبولة والمرفوضة على بنود أمر التوريد.",
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Package size={13} />
                {translate("Purchase Order", "أمر التوريد")}
              </div>
              <p className="font-mono text-sm font-semibold text-gray-800">{order?.code}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="mb-1 text-xs text-gray-500">{translate("Lines included", "البنود المشمولة")}</div>
              <p className="text-sm font-semibold text-gray-800">
                {translate(`${confirmSummary.lineCount} line(s)`, `${confirmSummary.lineCount} بند`)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {translate(
                  `${confirmSummary.receivedLines} with received · ${confirmSummary.rejectedLines} with rejected`,
                  `${confirmSummary.receivedLines} بمستلم · ${confirmSummary.rejectedLines} بمرفوض`,
                )}
              </p>
            </div>
          </div>

          {mutation.error && <ErrorAlert error={getErrorMessage(locale, mutation.error)} />}

          <div className="flex gap-2">
            <Button variant="light" color="dark" radius="md" onClick={closeConfirm} disabled={mutation.isPending} fullWidth>
              {translation.cancel}
            </Button>
            <Button color="teal" radius="md" loading={mutation.isPending} onClick={() => mutation.mutate()} fullWidth>
              {translate("Confirm & Create", "تأكيد وإنشاء")}
            </Button>
          </div>
        </div>
      </Modal>
    </LayoutBox>
  );
}
