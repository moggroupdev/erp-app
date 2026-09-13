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
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversionsSelection } from "@/types/material";
import { Badge, Button, NumberInput, Table, TextInput, Textarea } from "@mantine/core";
import { Link2, Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectSupplier from "@/components/global/selections/remote-based/select-supplier";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import { convertEnteredQuantityBetweenUnits } from "../helpers";
import { resolveDisplayUnit, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import LinkRequisitionsModal, { type AllocationDraft } from "./components/link-requisitions-modal";
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

function createEmptyRow(): ItemDraftRow {
  return {
    key: createRowKey(),
    materialCode: null,
    materialTitle: "",
    materialType: null,
    unitOfMeasurement: null,
    unitConversions: [],
    unitOfMeasurementSelected: null,
    quantity: "",
    unitPrice: "",
    notes: "",
    allocations: [],
  };
}

function showUnitSelect(row: ItemDraftRow) {
  return !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function isEmptyRow(row: ItemDraftRow) {
  return (
    row.materialCode === null &&
    row.quantity === "" &&
    row.unitPrice === "" &&
    row.notes.trim() === "" &&
    row.allocations.length === 0
  );
}

function getRowUnitOptions(row: ItemDraftRow, locale: Locale) {
  return getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale);
}

function allocationSummaryLabel(row: ItemDraftRow, locale: Locale, translate: (en: string, ar: string) => string) {
  if (row.allocations.length === 0) return translate("Not linked", "غير مربوط");
  if (row.allocations.length === 1) {
    const allocation = row.allocations[0];
    const unit = row.unitOfMeasurementSelected ? getMaterialUnitLabel(row.unitOfMeasurementSelected, locale) : "";
    return `${allocation.requisitionCode} · ${formatQuantity(allocation.quantityAllocated)} ${unit}`.trim();
  }
  return translate(`${row.allocations.length} requisitions`, `${row.allocations.length} طلبات شراء`);
}

function ItemRow({
  row,
  index,
  locale,
  currency,
  usedMaterialCodes,
  canRemove,
  onMaterialSelect,
  onUpdate,
  onRemove,
  onLinkRequisitions,
}: {
  row: ItemDraftRow;
  index: number;
  locale: Locale;
  currency: string;
  usedMaterialCodes: string[];
  canRemove: boolean;
  onMaterialSelect: (key: string, material: MaterialWithUnitConversionsSelection | null) => void;
  onUpdate: (key: string, patch: Partial<ItemDraftRow>) => void;
  onRemove: (key: string) => void;
  onLinkRequisitions: (key: string) => void;
}) {
  const { translate } = useI18n();
  const quantity = typeof row.quantity === "number" ? row.quantity : null;
  const unitPrice = typeof row.unitPrice === "number" ? row.unitPrice : null;
  const lineTotal = quantity !== null && unitPrice !== null ? quantity * unitPrice : null;
  const linkedTotal = row.allocations.reduce((sum, rowAllocation) => sum + rowAllocation.quantityAllocated, 0);
  const underLinked = quantity !== null && linkedTotal + 1e-9 < quantity && row.allocations.length > 0;

  return (
    <>
      <Table.Tr>
        <Table.Td className="w-[2.5%] text-center text-xs font-medium text-gray-500">{index + 1}</Table.Td>
        <Table.Td className="transition-colors focus-within:bg-teal-50/60">
          <SelectMaterial
            value={row.materialCode}
            setValue={(next) => {
              const resolved = typeof next === "function" ? next(row.materialCode) : next;
              if (!resolved) onMaterialSelect(row.key, null);
              else onUpdate(row.key, { materialCode: resolved, allocations: [] });
            }}
            onMaterialSelect={(material) => onMaterialSelect(row.key, material)}
            excludeCodes={usedMaterialCodes.filter((c) => c !== row.materialCode)}
            placeholder={translate("Enter material...", "أدخل المادة...")}
            variant="unstyled"
            radius={0}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
            withBrowseModal
          />
        </Table.Td>
        <Table.Td className="transition-colors focus-within:bg-teal-50/60">
          <NumberInput
            value={row.quantity}
            onChange={(value) => onUpdate(row.key, { quantity: value === "" ? "" : Number(value) })}
            min={0}
            allowNegative={false}
            decimalScale={6}
            hideControls
            variant="unstyled"
            radius={0}
            placeholder={translate("Enter quantity", "أدخل الكمية")}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
          />
        </Table.Td>
        <Table.Td className="transition-colors focus-within:bg-teal-50/60">
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
                onUpdate(row.key, {
                  unitOfMeasurementSelected: nextUnit,
                  allocations: convertedAllocations,
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
        <Table.Td className="transition-colors focus-within:bg-teal-50/60">
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
        <Table.Td>
          <span className="text-sm font-medium text-gray-600">{lineTotal !== null ? formatMoney(lineTotal) : ""}</span>
        </Table.Td>
        <Table.Td className="transition-colors focus-within:bg-teal-50/60">
          <TextInput
            value={row.notes}
            onChange={(e) => onUpdate(row.key, { notes: e.target.value })}
            placeholder={translate("Optional", "اختياري")}
            variant="unstyled"
            radius={0}
            styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
          />
        </Table.Td>
        <Table.Td className="w-[2.5%]">
          <Button
            type="button"
            variant="subtle"
            color="red"
            size="xs"
            radius="md"
            p={6}
            disabled={!canRemove}
            onClick={() => onRemove(row.key)}
            title={translate("Remove row", "حذف الصف")}
          >
            <Trash2 size={14} />
          </Button>
        </Table.Td>
      </Table.Tr>
      <Table.Tr className="bg-gray-50/70">
        <Table.Td />
        <Table.Td colSpan={7}>
          <div className="flex flex-wrap items-center gap-2 py-1">
            <Badge size="sm" variant="light" color={row.allocations.length > 0 ? "teal" : "gray"} radius="md">
              {allocationSummaryLabel(row, locale, translate)}
            </Badge>
            {underLinked && (
              <Badge size="sm" variant="light" color="orange" radius="md">
                {translate("Partially linked", "مربوط جزئياً")}
              </Badge>
            )}
            <Button
              type="button"
              variant="subtle"
              color="teal"
              size="compact-xs"
              radius="md"
              leftSection={<Link2 size={13} />}
              disabled={!row.materialCode || !row.unitOfMeasurementSelected}
              onClick={() => onLinkRequisitions(row.key)}
            >
              {translate("Link requisitions", "ربط طلبات الشراء")}
            </Button>
          </div>
        </Table.Td>
      </Table.Tr>
    </>
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
  const [rows, setRows] = useState<ItemDraftRow[]>([createEmptyRow()]);
  const [validationError, setValidationError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [prefillDone, setPrefillDone] = useState(!requisitionIdParam);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
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
      const items = rows
        .filter((row) => !isEmptyRow(row))
        .map((row) => {
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
            ...(requisitionAllocations.length > 0 ? { requisitionAllocations } : {}),
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

  const isDirty = useMemo(
    () => supplierId !== null || notes.trim() !== "" || rows.length > 1 || rows.some((row) => !isEmptyRow(row)),
    [supplierId, notes, rows],
  );

  const confirmNavigation = useUnsavedChangesWarning(isDirty && !submitted);

  const usedMaterialCodes = useMemo(
    () => rows.map((row) => row.materialCode).filter((code): code is string => !!code),
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

  function handleMaterialSelect(key: string, material: MaterialWithUnitConversionsSelection | null) {
    updateRow(key, {
      materialCode: material?.code ?? null,
      materialTitle: material?.title ?? "",
      materialType: material?.materialType ?? null,
      unitOfMeasurement: material?.unitOfMeasurement ?? null,
      unitConversions: material?.unitConversions ?? [],
      unitOfMeasurementSelected: material?.unitOfMeasurement ?? null,
      unitPrice: material?.unitPrice ?? "",
      allocations: [],
    });
    setValidationError("");
  }

  useEffect(() => {
    const incomplete = rows.filter((row) => row.materialCode && !row.materialType);
    if (incomplete.length === 0) return;

    let cancelled = false;

    Promise.all(
      incomplete.map(async (row) => {
        try {
          const material = await materialsApi.get({ privateRequest, code: row.materialCode! });
          if (!cancelled) {
            updateRow(row.key, {
              materialTitle: material.title,
              materialType: material.materialType,
              unitOfMeasurement: material.unitOfMeasurement,
              unitConversions: material.unitConversions,
              unitOfMeasurementSelected: row.unitOfMeasurementSelected ?? material.unitOfMeasurement,
              unitPrice: row.unitPrice === "" ? (material.unitPrice ?? "") : row.unitPrice,
            });
          }
        } catch {
          // Leave the row as-is; user can re-select the material.
        }
      }),
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((row) => `${row.key}:${row.materialCode}:${row.materialType}`).join("|")]);

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== key)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!supplierId) {
      return setValidationError(translate("Please select a supplier.", "يرجى اختيار مورد."));
    }

    const filledRows = rows.filter((row) => !isEmptyRow(row));
    if (filledRows.length === 0) {
      return setValidationError(translate("Please add at least one item.", "يرجى إضافة بند واحد على الأقل."));
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (isEmptyRow(row)) continue;

      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);
      const materialName = row.materialTitle || row.materialCode;

      if (!row.materialCode) {
        return setValidationError(translate(`${rowLabel}: please select a material.`, `${rowLabel}: يرجى اختيار مادة.`));
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
            `${rowLabel}: please enter the quantity for material ${materialName}.`,
            `${rowLabel}: يرجى إدخال الكمية للمادة ${materialName}.`,
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

      const linkedTotal = row.allocations.reduce((sum, allocation) => sum + allocation.quantityAllocated, 0);
      if (linkedTotal > qty + 1e-9) {
        return setValidationError(
          translate(
            `${rowLabel}: linked requisition quantity exceeds ordered quantity for material ${materialName}.`,
            `${rowLabel}: كمية طلبات الشراء المربوطة تتجاوز الكمية المطلوبة للمادة ${materialName}.`,
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
          backLink: getLocalizedHref("/procurement/material-orders"),
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
          backLink: getLocalizedHref("/procurement/material-orders"),
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
        backLink: getLocalizedHref("/procurement/material-orders"),
        confirmNavigate: confirmNavigation,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {seedRequisition && getRequisitionStatus(seedRequisition) === "approved" && (
          <div className="rounded-xl bg-teal-50/60 px-4 py-3 text-sm text-teal-800">
            {translate(
              `Prefilling from requisition ${seedRequisition.code}. You can adjust quantities, prices, and links before creating the order.`,
              `يتم التعبئة من طلب الشراء ${seedRequisition.code}. يمكنك تعديل الكميات والأسعار والربط قبل إنشاء الأمر.`,
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
          <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

          <div className="overflow-x-auto rounded-xl">
            <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
              <Table.Thead className="bg-gray-50">
                <Table.Tr className="h-9">
                  <Table.Th className="w-[2.5%] text-center! text-gray-500">#</Table.Th>
                  <Table.Th className="w-[28%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Material", "المادة")}
                  </Table.Th>
                  <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Quantity", "الكمية")}
                  </Table.Th>
                  <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Unit", "الوحدة")}
                  </Table.Th>
                  <Table.Th className="w-[12%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Unit Price", "سعر الوحدة")} ({translation.currency})
                  </Table.Th>
                  <Table.Th className="w-[12%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                    {translate("Line Total", "إجمالي البند")} ({translation.currency})
                  </Table.Th>
                  <Table.Th className="w-[22.5%] text-xs font-medium tracking-wide text-gray-500 uppercase">
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
                    usedMaterialCodes={usedMaterialCodes}
                    canRemove={rows.length > 1}
                    onMaterialSelect={handleMaterialSelect}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                    onLinkRequisitions={setLinkRowKey}
                  />
                ))}
              </Table.Tbody>
              <Table.Tfoot className="bg-gray-50">
                <Table.Tr className="h-9">
                  <Table.Td />
                  <Table.Td>
                    <Button
                      type="button"
                      variant="light"
                      color="teal"
                      radius="md"
                      size="xs"
                      leftSection={<Plus size={14} />}
                      onClick={addRow}
                    >
                      {translate("Add Row", "إضافة صف")}
                    </Button>
                  </Table.Td>
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
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </div>
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
            <Button radius="md" color="teal" loading={mutation.isPending} onClick={handleConfirmCreate} fullWidth>
              {translate("Confirm & Create", "تأكيد وإنشاء")}
            </Button>
          </div>
          {error && <ErrorAlert error={error} />}
        </div>
      </Modal>

      {linkRow && linkRow.materialCode && linkRow.unitOfMeasurementSelected && linkRow.unitOfMeasurement && (
        <LinkRequisitionsModal
          opened={!!linkRowKey}
          onClose={() => setLinkRowKey(null)}
          materialCode={linkRow.materialCode}
          materialTitle={linkRow.materialTitle}
          orderUnit={linkRow.unitOfMeasurementSelected}
          baseUnit={linkRow.unitOfMeasurement}
          unitConversions={linkRow.unitConversions}
          quantityOrdered={linkRow.quantity}
          existingAllocations={linkRow.allocations}
          onSave={(allocations) => updateRow(linkRow.key, { allocations })}
        />
      )}
    </LayoutBox>
  );
}
