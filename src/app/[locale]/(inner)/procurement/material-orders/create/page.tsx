"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseOrdersApi from "@/lib/api/material-purchase-orders";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";
import { Badge, Button, NumberInput, Table, TextInput, Textarea } from "@mantine/core";
import { ClipboardList, Link2, Plus, Trash2, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import { convertEnteredQuantityBetweenUnits } from "../helpers";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import {
  getProductionSubDepartmentLabel,
  type ProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import LinkRequisitionsModal, { type AllocationDraft } from "./components/link-requisitions-modal";
import AddFromRequisitionsModal, { type AddedMaterialLine } from "./components/add-from-requisitions-modal";
import { getRequisitionStatus } from "../../material-requisitions/helpers";

const PAGE_TITLE = { en: "Create Material Purchase Order", ar: "إنشاء أمر توريد خامات" };

type ItemDraftRow = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  materialType: MaterialType | null;
  unitOfMeasurement: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | "";
  unitPrice: number | "";
  notes: string;
  allocations: AllocationDraft[];
};

function createRowKey() {
  return `mpo-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function showUnitSelect(row: ItemDraftRow) {
  return !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function getRowUnitOptions(row: ItemDraftRow, locale: Locale) {
  return getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale);
}

function allocationLinkedTotal(row: ItemDraftRow) {
  return row.allocations.reduce((sum, allocation) => sum + allocation.quantityAllocated, 0);
}

function mergeAllocations(existing: AllocationDraft[], incoming: AllocationDraft[]): AllocationDraft[] {
  const byId = new Map(existing.map((allocation) => [allocation.materialPurchaseRequisitionItemId, allocation]));
  for (const allocation of incoming) {
    const prev = byId.get(allocation.materialPurchaseRequisitionItemId);
    if (prev) {
      byId.set(allocation.materialPurchaseRequisitionItemId, {
        ...prev,
        quantityAllocated: Number((prev.quantityAllocated + allocation.quantityAllocated).toFixed(6)),
        quantityRemaining: allocation.quantityRemaining,
      });
    } else {
      byId.set(allocation.materialPurchaseRequisitionItemId, allocation);
    }
  }
  return [...byId.values()];
}

function ItemRow({
  row,
  index,
  locale,
  currency,
  onUpdate,
  onRemove,
  onLinkRequisitions,
  onRemoveAllocation,
}: {
  row: ItemDraftRow;
  index: number;
  locale: Locale;
  currency: string;
  onUpdate: (key: string, patch: Partial<ItemDraftRow>) => void;
  onRemove: (key: string) => void;
  onLinkRequisitions: (key: string) => void;
  onRemoveAllocation: (rowKey: string, requisitionItemId: string) => void;
}) {
  const { translate } = useI18n();
  const quantity = typeof row.quantity === "number" ? row.quantity : null;
  const unitPrice = typeof row.unitPrice === "number" ? row.unitPrice : null;
  const lineTotal = quantity !== null && unitPrice !== null ? quantity * unitPrice : null;
  const linkedTotal = allocationLinkedTotal(row);
  const unitLabel = row.unitOfMeasurementSelected ? getMaterialUnitLabel(row.unitOfMeasurementSelected, locale) : "";
  const fullyLinked = quantity !== null && row.allocations.length > 0 && Math.abs(linkedTotal - quantity) <= 1e-9;

  return (
    <Table.Tr>
      <Table.Td className="w-[2.5%] pt-2 text-center align-top! text-xs font-medium text-gray-500">{index + 1}</Table.Td>
      <Table.Td className="align-top!">
        <div className="flex flex-col gap-1.5 py-0.5">
          <span className="text-sm font-medium text-gray-800">{row.materialTitle || row.materialCode}</span>
          {row.materialCode && <span className="font-mono text-xs text-gray-400">{row.materialCode}</span>}
        </div>
      </Table.Td>
      <Table.Td className="pt-2 align-top!">
        <span className="text-sm text-gray-700">{quantity !== null ? formatQuantity(quantity) : ""}</span>
      </Table.Td>
      <Table.Td className="align-top! transition-colors focus-within:bg-teal-800/5">
        {showUnitSelect(row) ? (
          <DataSelect
            value={row.unitOfMeasurementSelected}
            setValue={(next) => {
              const resolved = typeof next === "function" ? next(row.unitOfMeasurementSelected) : next;
              const nextUnit = (resolved as MaterialUnit | null) ?? row.unitOfMeasurement;
              if (!nextUnit || !row.unitOfMeasurement || !row.unitOfMeasurementSelected) {
                onUpdate(row.key, { unitOfMeasurementSelected: nextUnit });
                return;
              }
              const convertedAllocations = row.allocations.map((allocation) => ({
                ...allocation,
                quantityAllocated: convertEnteredQuantityBetweenUnits(
                  allocation.quantityAllocated,
                  row.unitOfMeasurementSelected!,
                  nextUnit,
                  row.unitOfMeasurement!,
                  row.unitConversions,
                ),
              }));
              const nextQty = convertedAllocations.reduce((sum, allocation) => sum + allocation.quantityAllocated, 0);
              onUpdate(row.key, {
                unitOfMeasurementSelected: nextUnit,
                allocations: convertedAllocations,
                quantity: Number(nextQty.toFixed(6)),
              });
            }}
            data={getRowUnitOptions(row, locale)}
            variant="unstyled"
            radius={0}
            searchable
            placeholder={translate("Select unit", "اختر الوحدة")}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
          />
        ) : (
          <span className="text-sm text-gray-600">
            {row.unitOfMeasurementSelected ? getMaterialUnitLabel(row.unitOfMeasurementSelected, locale) : ""}
          </span>
        )}
      </Table.Td>
      <Table.Td className="align-top! transition-colors focus-within:bg-teal-800/5">
        <NumberInput
          value={row.unitPrice}
          onChange={(value) => onUpdate(row.key, { unitPrice: value === "" ? "" : Number(value) })}
          min={0}
          allowNegative={false}
          decimalScale={6}
          hideControls
          variant="unstyled"
          radius={0}
          placeholder={translate("Enter price", "أدخل السعر")}
          styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
          aria-label={translate(`Unit Price (${currency})`, `سعر الوحدة (${currency})`)}
        />
      </Table.Td>
      <Table.Td className="pt-2 align-top!">
        <span className="text-sm font-medium text-gray-600">{lineTotal !== null ? formatMoney(lineTotal) : ""}</span>
      </Table.Td>
      <Table.Td className="align-top!">
        <div className="flex flex-col gap-1.5 py-0.5">
          <div className="flex items-center justify-between gap-2">
            <Badge
              size="xs"
              variant="light"
              color={fullyLinked ? "teal" : "orange"}
              radius="md"
              leftSection={<Link2 size={10} />}
            >
              {quantity !== null ? `${formatQuantity(linkedTotal)} ${unitLabel}`.trim() : formatQuantity(linkedTotal)}
            </Badge>
            <Button
              type="button"
              variant="subtle"
              color="teal"
              size="compact-xs"
              radius="md"
              px={6}
              leftSection={<Link2 size={12} />}
              disabled={!row.materialCode || !row.unitOfMeasurementSelected}
              onClick={() => onLinkRequisitions(row.key)}
            >
              {translate("Edit", "تعديل")}
            </Button>
          </div>

          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {row.allocations.map((allocation) => (
              <li
                key={allocation.materialPurchaseRequisitionItemId}
                className="group flex items-start justify-between gap-2 rounded-md bg-teal-800/[0.07] px-2 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="font-mono text-[11px] font-semibold text-teal-900">{allocation.requisitionCode}</span>
                    <span className="text-[11px] text-teal-800/75">
                      {formatQuantity(allocation.quantityAllocated)} {unitLabel}
                    </span>
                  </div>
                  {allocation.productionSubDepartment && (
                    <p className="mt-0.5 truncate text-[10px] text-teal-800/50">
                      {getProductionSubDepartmentLabel(
                        allocation.productionSubDepartment as ProductionSubDepartment,
                        locale,
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-0.5 text-teal-800/50 opacity-70 transition-colors group-hover:opacity-100 hover:bg-teal-800/10 hover:text-teal-900"
                  onClick={() => onRemoveAllocation(row.key, allocation.materialPurchaseRequisitionItemId)}
                  title={translate("Remove link", "إزالة الربط")}
                  aria-label={translate("Remove link", "إزالة الربط")}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Table.Td>
      <Table.Td className="align-top! transition-colors focus-within:bg-teal-800/5">
        <TextInput
          value={row.notes}
          onChange={(e) => onUpdate(row.key, { notes: e.target.value })}
          placeholder={translate("Optional", "اختياري")}
          variant="unstyled"
          radius={0}
          styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
        />
      </Table.Td>
      <Table.Td className="w-[2.5%] align-top!">
        <Button
          type="button"
          variant="subtle"
          color="red"
          size="xs"
          radius="md"
          p={6}
          onClick={() => onRemove(row.key)}
          title={translate("Remove row", "حذف الصف")}
        >
          <Trash2 size={14} />
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requisitionIdParam = searchParams.get("requisitionId");
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ItemDraftRow[]>([]);
  const [validationError, setValidationError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [prefillDone, setPrefillDone] = useState(!requisitionIdParam);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [linkRowKey, setLinkRowKey] = useState<string | null>(null);

  useDocumentTitle(
    `${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Material Purchase Orders", "أوامر توريد الخامات")}`,
  );

  const {
    data: seedRequisition,
    isFetching: isSeedFetching,
    error: seedError,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseRequisitions.detail(requisitionIdParam || "none"),
    queryFn: ({ signal }) => materialPurchaseRequisitionsApi.get({ privateRequest, id: requisitionIdParam!, signal }),
    staleTime: staleTimes.materialPurchaseRequisitions,
    enabled: !!requisitionIdParam,
  });

  useEffect(() => {
    if (!requisitionIdParam || !seedRequisition || prefillDone) return;

    if (getRequisitionStatus(seedRequisition) !== "approved") {
      setValidationError(
        translate(
          "Only fully approved requisitions can be used to create a purchase order.",
          "يمكن إنشاء أمر توريد فقط من طلبات الشراء المعتمدة بالكامل.",
        ),
      );
      setPrefillDone(true);
      return;
    }

    const remainingItems = seedRequisition.items.filter((item) => Number(item.quantityRemaining) > 1e-9);
    if (remainingItems.length === 0) {
      setValidationError(
        translate("This requisition has no remaining quantity to order.", "لا توجد كمية متبقية للطلب في طلب الشراء هذا."),
      );
      setPrefillDone(true);
      return;
    }

    setRows(
      remainingItems.map((item) => {
        const { factor } = resolveDisplayUnit(
          item.unitOfMeasurementSelected,
          item.material.unitOfMeasurement,
          item.material.unitConversions,
        );
        const unitPrice =
          item.unitPrice != null && Number(item.unitPrice) > 0 ? toDisplayUnitPrice(Number(item.unitPrice), factor) : "";

        return {
          key: createRowKey(),
          materialCode: item.materialCode,
          materialTitle: item.material.title,
          materialType: item.material.materialType,
          unitOfMeasurement: item.material.unitOfMeasurement,
          unitConversions: item.material.unitConversions,
          unitOfMeasurementSelected: item.unitOfMeasurementSelected,
          quantity: Number(item.quantityRemaining),
          unitPrice,
          notes: item.notes ?? "",
          allocations: [
            {
              materialPurchaseRequisitionItemId: item.id,
              requisitionId: seedRequisition.id,
              requisitionCode: seedRequisition.code,
              productionSubDepartment: seedRequisition.productionSubDepartment,
              unitOfMeasurementSelected: item.unitOfMeasurementSelected,
              quantityRemaining: Number(item.quantityRemaining),
              quantityAllocated: Number(item.quantityRemaining),
            },
          ],
        };
      }),
    );

    setPrefillDone(true);
  }, [requisitionIdParam, seedRequisition, prefillDone, translate]);

  const mutation = useMutation({
    mutationFn: async () => {
      const items = rows.map((row) => {
        const requisitionAllocations = row.allocations.map((allocation) => ({
          materialPurchaseRequisitionItemId: allocation.materialPurchaseRequisitionItemId,
          quantityAllocated: convertEnteredQuantityBetweenUnits(
            allocation.quantityAllocated,
            row.unitOfMeasurementSelected!,
            allocation.unitOfMeasurementSelected,
            row.unitOfMeasurement!,
            row.unitConversions,
          ),
        }));

        return {
          materialCode: row.materialCode!,
          unitOfMeasurementSelected: row.unitOfMeasurementSelected!,
          quantityOrdered: Number(row.quantity),
          unitPrice: Number(row.unitPrice),
          notes: row.notes.trim() || null,
          requisitionAllocations,
        };
      });

      return await materialPurchaseOrdersApi.create({
        privateRequest,
        dto: {
          supplierId: supplierId!,
          notes: notes.trim() || null,
          items,
        },
      });
    },
    onSuccess: async (created) => {
      setSubmitted(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseOrders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.materialPurchaseRequisitions.all }),
      ]);
      router.push(getLocalizedHref(`/procurement/material-orders/${created.id}`));
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  const isDirty = useMemo(() => supplierId !== null || notes.trim() !== "" || rows.length > 0, [supplierId, notes, rows]);

  const confirmNavigation = useUnsavedChangesWarning(isDirty && !submitted);

  const excludedRequisitionItemIds = useMemo(
    () => rows.flatMap((row) => row.allocations.map((allocation) => allocation.materialPurchaseRequisitionItemId)),
    [rows],
  );

  const grandTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const qty = typeof row.quantity === "number" ? row.quantity : 0;
        const price = typeof row.unitPrice === "number" ? row.unitPrice : 0;
        return sum + qty * price;
      }, 0),
    [rows],
  );

  const linkRow = linkRowKey ? rows.find((row) => row.key === linkRowKey) : null;

  function updateRow(key: string, patch: Partial<ItemDraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((row) => row.key !== key));
    if (linkRowKey === key) setLinkRowKey(null);
  }

  function removeAllocation(rowKey: string, requisitionItemId: string) {
    setRows((prev) =>
      prev.flatMap((row) => {
        if (row.key !== rowKey) return [row];
        const allocations = row.allocations.filter(
          (allocation) => allocation.materialPurchaseRequisitionItemId !== requisitionItemId,
        );
        if (allocations.length === 0) return [];
        const quantity = Number(allocations.reduce((sum, allocation) => sum + allocation.quantityAllocated, 0).toFixed(6));
        return [{ ...row, allocations, quantity }];
      }),
    );
  }

  function handleAddFromRequisitions(lines: AddedMaterialLine[]) {
    setValidationError("");
    setRows((prev) => {
      const next = [...prev];
      for (const line of lines) {
        const existingIndex = next.findIndex((row) => row.materialCode === line.materialCode);
        if (existingIndex >= 0) {
          const existing = next[existingIndex];
          const convertedIncoming = line.allocations.map((allocation) => ({
            ...allocation,
            quantityAllocated: convertEnteredQuantityBetweenUnits(
              allocation.quantityAllocated,
              line.unitOfMeasurementSelected,
              existing.unitOfMeasurementSelected!,
              existing.unitOfMeasurement!,
              existing.unitConversions,
            ),
          }));
          const allocations = mergeAllocations(existing.allocations, convertedIncoming);
          const quantity = Number(allocations.reduce((sum, allocation) => sum + allocation.quantityAllocated, 0).toFixed(6));
          next[existingIndex] = { ...existing, allocations, quantity };
        } else {
          next.push({
            key: createRowKey(),
            materialCode: line.materialCode,
            materialTitle: line.materialTitle,
            materialType: line.materialType,
            unitOfMeasurement: line.unitOfMeasurement,
            unitConversions: line.unitConversions,
            unitOfMeasurementSelected: line.unitOfMeasurementSelected,
            quantity: line.quantity,
            unitPrice: "",
            notes: "",
            allocations: line.allocations,
          });
        }
      }
      return next;
    });
  }

  function handleLinkSave(allocations: AllocationDraft[], nextQuantityOrdered: number) {
    if (!linkRowKey) return;
    if (allocations.length === 0) {
      removeRow(linkRowKey);
      return;
    }
    updateRow(linkRowKey, {
      allocations,
      quantity: nextQuantityOrdered,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!supplierId) {
      return setValidationError(translate("Please select a supplier.", "يرجى اختيار مورد."));
    }

    if (rows.length === 0) {
      return setValidationError(
        translate(
          "Please add at least one item from open purchase requisitions.",
          "يرجى إضافة بند واحد على الأقل من طلبات الشراء المفتوحة.",
        ),
      );
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);
      const materialName = row.materialTitle || row.materialCode;

      if (!row.materialCode) {
        return setValidationError(translate(`${rowLabel}: please select a material.`, `${rowLabel}: يرجى اختيار مادة.`));
      }

      if (row.allocations.length === 0) {
        return setValidationError(
          translate(
            `${rowLabel}: material ${materialName} must be linked to open purchase requisition lines.`,
            `${rowLabel}: يجب ربط المادة ${materialName} ببنود طلبات شراء مفتوحة.`,
          ),
        );
      }

      if (!row.unitOfMeasurementSelected || !row.unitOfMeasurement) {
        return setValidationError(
          translate(
            `${rowLabel}: please select the unit for material ${materialName}.`,
            `${rowLabel}: يرجى اختيار الوحدة للمادة ${materialName}.`,
          ),
        );
      }

      if (row.quantity === "") {
        return setValidationError(
          translate(
            `${rowLabel}: quantity for material ${materialName} is missing.`,
            `${rowLabel}: كمية المادة ${materialName} غير موجودة.`,
          ),
        );
      }

      const qty = Number(row.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        return setValidationError(
          translate(
            `${rowLabel}: quantity for material ${materialName} must be greater than zero.`,
            `${rowLabel}: يجب أن تكون كمية المادة ${materialName} أكبر من صفر.`,
          ),
        );
      }

      if (row.unitPrice === "") {
        return setValidationError(
          translate(
            `${rowLabel}: please enter the unit price for material ${materialName}.`,
            `${rowLabel}: يرجى إدخال سعر الوحدة للمادة ${materialName}.`,
          ),
        );
      }

      const price = Number(row.unitPrice);
      if (Number.isNaN(price) || price <= 0) {
        return setValidationError(
          translate(
            `${rowLabel}: unit price for material ${materialName} must be greater than zero.`,
            `${rowLabel}: يجب أن يكون سعر الوحدة للمادة ${materialName} أكبر من صفر.`,
          ),
        );
      }

      const linkedTotal = allocationLinkedTotal(row);
      if (Math.abs(linkedTotal - qty) > 1e-9) {
        return setValidationError(
          translate(
            `${rowLabel}: linked requisition quantity must equal ordered quantity for material ${materialName}.`,
            `${rowLabel}: يجب أن تساوي كمية طلبات الشراء المربوطة الكمية المطلوبة للمادة ${materialName}.`,
          ),
        );
      }
    }

    handleOpenConfirm();
  }

  function handleConfirmCreate() {
    mutation.mutate();
  }

  function handleOpenConfirm() {
    mutation.reset();
    openConfirm();
  }

  if (requisitionIdParam && isSeedFetching && !prefillDone) {
    return (
      <LayoutBox
        header={{
          title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
          backLink: true,
        }}
      >
        <LoadingSection message={translate("Loading requisition", "جاري تحميل طلب الشراء")} />
      </LayoutBox>
    );
  }

  if (requisitionIdParam && seedError && !prefillDone) {
    return (
      <LayoutBox
        header={{
          title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
          backLink: true,
        }}
      >
        <ErrorSection
          errorTitle={translate("Failed to load requisition", "تعذر تحميل طلب الشراء")}
          errorMessage={getErrorMessage(locale, seedError)}
          button={{
            text: translate("Back to orders", "العودة إلى الأوامر"),
            onClick: () => router.push(getLocalizedHref("/procurement/material-orders")),
          }}
        />
      </LayoutBox>
    );
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        confirmNavigate: confirmNavigation,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {seedRequisition && getRequisitionStatus(seedRequisition) === "approved" && (
          <div className="rounded-xl bg-teal-800/[0.07] px-4 py-3 text-sm text-teal-900">
            {translate(
              `Prefilling from requisition ${seedRequisition.code}. You can adjust prices and links, or add more open requisition lines before creating the order.`,
              `يتم التعبئة من طلب الشراء ${seedRequisition.code}. يمكنك تعديل الأسعار والربط أو إضافة المزيد من بنود طلبات الشراء المفتوحة قبل إنشاء الأمر.`,
            )}
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SelectSupplier
            value={supplierId}
            setValue={setSupplierId}
            onSupplierSelect={() => setValidationError("")}
            label={translate("Supplier", "المورد")}
            placeholder={translate("Search or select a supplier...", "ابحث أو اختر مورداً...")}
            searchable
            clearable
            required
            radius="md"
          />
          <div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              label={translate("Notes", "الملاحظات")}
              placeholder={translate("Optional", "اختياري")}
              radius="md"
              autosize
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>
            <Button
              type="button"
              variant="light"
              color="teal"
              radius="md"
              size="sm"
              leftSection={<Plus size={14} />}
              onClick={openAdd}
            >
              {translate("Add from requisitions", "إضافة من طلبات الشراء")}
            </Button>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-teal-800/2.5 px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-800/15 text-teal-900">
                <ClipboardList size={26} strokeWidth={1.75} />
              </div>
              <div className="flex max-w-md flex-col gap-1.5">
                <h5 className="text-base font-semibold text-gray-900">{translate("No items yet", "لا توجد بنود بعد")}</h5>
                <p className="text-sm leading-relaxed text-gray-500">
                  {translate(
                    "Start by adding open purchase requisition lines. Materials and quantities will be filled from the selected requisitions.",
                    "ابدأ بإضافة بنود من طلبات الشراء المفتوحة. ستُعبأ المواد والكميات من الطلبات المحددة.",
                  )}
                </p>
              </div>
              <Button
                type="button"
                color="teal"
                radius="md"
                size="sm"
                leftSection={<Plus size={15} />}
                onClick={openAdd}
              >
                {translate("Add from requisitions", "إضافة من طلبات الشراء")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
                <Table.Thead className="bg-gray-50">
                  <Table.Tr className="h-9">
                    <Table.Th className="w-[2.5%] text-center! text-gray-500">#</Table.Th>
                    <Table.Th className="w-[22%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Material", "المادة")}
                    </Table.Th>
                    <Table.Th className="w-[8%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Quantity", "الكمية")}
                    </Table.Th>
                    <Table.Th className="w-[8%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Unit", "الوحدة")}
                    </Table.Th>
                    <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Unit Price", "سعر الوحدة")} ({translation.currency})
                    </Table.Th>
                    <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Line Total", "إجمالي البند")} ({translation.currency})
                    </Table.Th>
                    <Table.Th className="w-[22%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Requisitions", "طلبات الشراء")}
                    </Table.Th>
                    <Table.Th className="w-[14.5%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Notes", "الملاحظات")}
                    </Table.Th>
                    <Table.Th className="w-[3%]" />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((row, index) => (
                    <ItemRow
                      key={row.key}
                      row={row}
                      index={index}
                      locale={locale}
                      currency={translation.currency}
                      onUpdate={updateRow}
                      onRemove={removeRow}
                      onLinkRequisitions={setLinkRowKey}
                      onRemoveAllocation={removeAllocation}
                    />
                  ))}
                </Table.Tbody>
                <Table.Tfoot className="bg-gray-50">
                  <Table.Tr className="h-9">
                    <Table.Td />
                    <Table.Td />
                    <Table.Td />
                    <Table.Td />
                    <Table.Td>
                      <Badge size="sm" variant="light" color="dark" radius="md">
                        {translate("Total", "الإجمالي")}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm font-semibold text-gray-800">{formatMoney(grandTotal)}</span>
                    </Table.Td>
                    <Table.Td />
                    <Table.Td />
                    <Table.Td />
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </div>
          )}
        </section>

        {error && !confirmOpened && <ErrorAlert error={error} />}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="light"
            color="dark"
            radius="md"
            onClick={() => {
              if (confirmNavigation()) router.push(getLocalizedHref("/procurement/material-orders"));
            }}
          >
            {translation.cancel}
          </Button>
          <Button type="submit" radius="md" color="teal" disabled={mutation.isPending}>
            {translate("Create", "إنشاء")}
          </Button>
        </div>
      </form>

      <Modal
        opened={confirmOpened}
        onClose={() => {
          if (!mutation.isPending) closeConfirm();
        }}
        title={translate("Confirm create order", "تأكيد إنشاء الأمر")}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {translate(
              "Are you sure you want to create this material purchase order?",
              "هل أنت متأكد من إنشاء أمر توريد الخامات هذا؟",
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="light" color="dark" radius="md" onClick={closeConfirm} disabled={mutation.isPending} fullWidth>
              {translation.cancel}
            </Button>
            <Button
              radius="md"
              color="teal"
              loading={mutation.isPending}
              onClick={handleConfirmCreate}
              fullWidth
            >
              {translate("Confirm & Create", "تأكيد وإنشاء")}
            </Button>
          </div>
          {error && <ErrorAlert error={error} />}
        </div>
      </Modal>

      <AddFromRequisitionsModal
        opened={addOpened}
        onClose={closeAdd}
        excludedRequisitionItemIds={excludedRequisitionItemIds}
        onAdd={handleAddFromRequisitions}
      />

      {linkRow && linkRow.materialCode && linkRow.unitOfMeasurementSelected && linkRow.unitOfMeasurement && (
        <LinkRequisitionsModal
          opened={!!linkRowKey}
          onClose={() => setLinkRowKey(null)}
          materialCode={linkRow.materialCode}
          materialTitle={linkRow.materialTitle}
          orderUnit={linkRow.unitOfMeasurementSelected}
          baseUnit={linkRow.unitOfMeasurement}
          unitConversions={linkRow.unitConversions}
          existingAllocations={linkRow.allocations}
          onSave={handleLinkSave}
        />
      )}
    </LayoutBox>
  );
}
