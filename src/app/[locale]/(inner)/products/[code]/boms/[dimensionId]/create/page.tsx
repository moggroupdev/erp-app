"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import bomsApi from "@/lib/api/boms";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatMoney } from "@/lib/helpers/format-money";
import { toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { isManufacturedMaterial, isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversions } from "@/types/material";
import { Badge, Button, NumberInput, Table, TextInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import MmComponentsSection from "./components/mm-components-section";

const PAGE_TITLE = { en: "Create BOM", ar: "إنشاء قائمة مواد" };

type BomDraftRow = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  materialType: MaterialType | null;
  unitOfMeasurement: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  unit: MaterialUnit | null;
  unitPrice: number;
  quantityRequired: number | "";
  notes: string;
};

function createRowKey() {
  return `bom-row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyRow(): BomDraftRow {
  return {
    key: createRowKey(),
    materialCode: null,
    materialTitle: "",
    materialType: null,
    unitOfMeasurement: null,
    unitConversions: [],
    unit: null,
    unitPrice: 0,
    quantityRequired: "",
    notes: "",
  };
}

function showUnitSelect(row: BomDraftRow) {
  return !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
}

function getRowUnitOptions(row: BomDraftRow, locale: Locale) {
  if (!row.unitOfMeasurement) return [];
  const altUnits = row.unitConversions.map((conversion) => conversion.unit);
  const allUnits = [row.unitOfMeasurement, ...altUnits.filter((unit) => unit !== row.unitOfMeasurement)];
  return allUnits.map((value) => ({ value, label: getMaterialUnitLabel(value, locale) }));
}

function getRowFactor(row: BomDraftRow) {
  if (!row.unit || !row.unitOfMeasurement || row.unit === row.unitOfMeasurement) return 1;
  const conversion = row.unitConversions.find((item) => item.unit === row.unit);
  return conversion ? Number(conversion.conversionFactorToBase) : 1;
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const { code, dimensionId } = useParams<{ code: string; dimensionId: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<BomDraftRow[]>([createEmptyRow()]);
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [duplicateCodes, setDuplicateCodes] = useState<Set<string>>(new Set());

  useDocumentTitle(`${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("BOM", "قائمة المواد")}`);

  const bomQuery = useQuery({
    queryKey: queryKeys.boms.detail(dimensionId),
    queryFn: ({ signal }) => bomsApi.getByDimension({ privateRequest, dimensionId, signal }),
    staleTime: staleTimes.boms,
  });

  const bom = bomQuery.data || null;
  const departmentsWithBom = useMemo(
    () => new Set(bom?.standardBoms.map((item) => item.productionSubDepartment).filter(Boolean) as ProductionSubDepartment[]),
    [bom?.standardBoms],
  );
  const selectedDepartmentHasBom =
    !!productionSubDepartment && departmentsWithBom.has(productionSubDepartment as ProductionSubDepartment);

  const mutation = useMutation({
    mutationFn: async () => {
      return await bomsApi.create({
        privateRequest,
        dimensionId,
        dto: {
          items: rows.map((row) => ({
            materialCode: row.materialCode!,
            quantityRequired: Number(row.quantityRequired),
            productionSubDepartment: productionSubDepartment as ProductionSubDepartment,
            unitOfMeasurementSelected: row.unit as MaterialUnit,
            notes: row.notes.trim() || null,
          })),
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.boms.detail(dimensionId) });
      router.push(getLocalizedHref(`/products/${code}/boms/${dimensionId}`));
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");
  const currency = translation.currency;

  const usedMaterialCodes = useMemo(
    () => rows.map((row) => row.materialCode).filter((code): code is string => !!code),
    [rows],
  );

  // Selected manufactured materials (quantity optional; used to show the info alert).
  const mmRows = useMemo(
    () =>
      rows.filter(
        (row): row is BomDraftRow & { materialCode: string; materialType: MaterialType } =>
          !!row.materialCode && row.materialType !== null && isManufacturedMaterial(row.materialType),
      ),
    [rows],
  );

  const grandTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const qty = typeof row.quantityRequired === "number" ? row.quantityRequired : 0;
        return sum + qty * toDisplayUnitPrice(row.unitPrice, getRowFactor(row));
      }, 0),
    [rows],
  );

  function updateRow(key: string, patch: Partial<BomDraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleMaterialSelect(key: string, material: MaterialWithUnitConversions | null) {
    updateRow(key, {
      materialCode: material?.code ?? null,
      materialTitle: material?.title ?? "",
      materialType: material?.materialType ?? null,
      unitOfMeasurement: material?.unitOfMeasurement ?? null,
      unitConversions: material?.unitConversions ?? [],
      unit: material?.unitOfMeasurement ?? null,
      unitPrice: material?.unitPrice ?? 0,
    });
    setDuplicateCodes(new Set());
    setValidationError("");
  }

  // If a material code is set without metadata (e.g. setValue-only path), resolve it from the API.
  useEffect(() => {
    const incomplete = rows.filter((row) => row.materialCode && !row.materialType);
    if (incomplete.length === 0) return;

    let cancelled = false;

    Promise.all(
      incomplete.map(async (row) => {
        try {
          const material = await materialsApi.get({ privateRequest, code: row.materialCode! });
          if (!cancelled) handleMaterialSelect(row.key, material);
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
    setDuplicateCodes(new Set());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");
    setDuplicateCodes(new Set());

    if (!productionSubDepartment) {
      return setValidationError(
        translate("Please select a production department.", "يرجى اختيار قسم الانتاج."),
      );
    }

    if (selectedDepartmentHasBom) {
      return setValidationError(
        translate(
          "A BOM already exists for this production department.",
          "توجد بالفعل قائمة مواد لقسم الانتاج هذا.",
        ),
      );
    }

    // Validation Layer
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowLabel = translate(`Row ${index + 1}`, `الصف ${index + 1}`);

      if (!row.materialCode)
        return setValidationError(translate(`${rowLabel}: please select a material.`, `${rowLabel}: يرجى اختيار مادة.`));

      if (row.quantityRequired === "")
        return setValidationError(translate(`${rowLabel}: quantity is required.`, `${rowLabel}: الكمية مطلوبة.`));

      const qty = Number(row.quantityRequired);
      if (Number.isNaN(qty))
        return setValidationError(
          translate(`${rowLabel}: quantity must be a valid number.`, `${rowLabel}: يجب أن تكون الكمية رقماً صالحاً.`),
        );

      if (qty < 0)
        return setValidationError(
          translate(`${rowLabel}: quantity cannot be negative.`, `${rowLabel}: لا يمكن أن تكون الكمية سالبة.`),
        );

      if (qty === 0)
        return setValidationError(
          translate(`${rowLabel}: quantity must be greater than zero.`, `${rowLabel}: يجب أن تكون الكمية أكبر من صفر.`),
        );
    }

    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const row of rows) {
      const materialCode = row.materialCode!;
      if (seen.has(materialCode)) duplicates.add(materialCode);
      else seen.add(materialCode);
    }

    if (duplicates.size > 0) {
      setDuplicateCodes(duplicates);
      return setValidationError(
        translate("Duplicate materials are not allowed in the same BOM.", "لا يُسمح بتكرار المواد في نفس قائمة المواد."),
      );
    }

    mutation.mutate();
  }

  if (bomQuery.isFetching) {
    return (
      <LayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar), backLink: true }}>
        <LoadingSection message={translate("Loading...", "جاري التحميل...")} />
      </LayoutBox>
    );
  }

  if (bomQuery.error) {
    return (
      <LayoutBox header={{ title: translate(PAGE_TITLE.en, PAGE_TITLE.ar), backLink: true }}>
        <ErrorSection
          errorTitle={translate("An error occurred while loading dimension data", "حدث خطأ أثناء تحميل بيانات المقاس")}
          errorMessage={getErrorMessage(locale, bomQuery.error)}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => bomQuery.refetch() }}
        />
      </LayoutBox>
    );
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: bom
          ? `${bom.product.title} · ${formatDimensionLabelText(bom, translation.productDimensionUnit)}`
          : undefined,
        backLink: true,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SelectProductionSubDepartment
          value={productionSubDepartment}
          setValue={setProductionSubDepartment}
          label={translate("Production Department", "قسم الانتاج")}
          placeholder={translate("Select department", "اختر القسم")}
          excludeValues={[...departmentsWithBom]}
          required
        />

        <div className="overflow-x-auto rounded-xl">
          <Table withColumnBorders className="w-full table-fixed" horizontalSpacing="xs" verticalSpacing="xs">
            <Table.Thead className="bg-gray-50">
              <Table.Tr className="h-9">
                <Table.Th className="w-[34%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Material", "المادة")}
                </Table.Th>
                <Table.Th className="w-[10%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Quantity", "الكمية")}
                </Table.Th>
                <Table.Th className="w-[12%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Unit", "الوحدة")}
                </Table.Th>
                <Table.Th className="w-[9%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Unit Price", "سعر الوحدة")} ({currency})
                </Table.Th>
                <Table.Th className="w-[9%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Line Total", "إجمالي البند")} ({currency})
                </Table.Th>
                <Table.Th className="w-[20%] text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Notes", "الملاحظات")}
                </Table.Th>
                <Table.Th className="w-[6%]" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => {
                const quantity = typeof row.quantityRequired === "number" ? row.quantityRequired : null;
                const displayUnitPrice = toDisplayUnitPrice(row.unitPrice, getRowFactor(row));
                const lineTotal = quantity !== null ? quantity * displayUnitPrice : null;
                const isDuplicate = !!row.materialCode && duplicateCodes.has(row.materialCode);

                return (
                  <Table.Tr key={row.key} className={isDuplicate ? "bg-red-50/70" : undefined}>
                    <Table.Td className="transition-colors focus-within:bg-teal-50/60">
                      <SelectMaterial
                        value={row.materialCode}
                        setValue={(next) => {
                          const resolved = typeof next === "function" ? next(row.materialCode) : next;
                          if (!resolved) handleMaterialSelect(row.key, null);
                          else updateRow(row.key, { materialCode: resolved });
                        }}
                        onMaterialSelect={(material) => handleMaterialSelect(row.key, material)}
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
                        value={row.quantityRequired}
                        onChange={(value) => updateRow(row.key, { quantityRequired: value === "" ? "" : Number(value) })}
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
                          value={row.unit}
                          setValue={(next) => {
                            const resolved = typeof next === "function" ? next(row.unit) : next;
                            updateRow(row.key, { unit: (resolved as MaterialUnit | null) ?? row.unitOfMeasurement });
                          }}
                          data={getRowUnitOptions(row, locale)}
                          variant="unstyled"
                          radius={0}
                          searchable
                          styles={{ input: { minHeight: 0, height: "auto", padding: 0, cursor: "pointer" } }}
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {row.unitOfMeasurement ? getMaterialUnitLabel(row.unitOfMeasurement, locale) : ""}
                        </span>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm text-gray-600">
                        {row.materialCode ? formatMoney(displayUnitPrice) : ""}
                      </span>
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm font-medium text-gray-600">
                        {lineTotal !== null ? formatMoney(lineTotal) : ""}
                      </span>
                    </Table.Td>
                    <Table.Td className="transition-colors focus-within:bg-teal-50/60">
                      <TextInput
                        value={row.notes}
                        onChange={(e) => updateRow(row.key, { notes: e.target.value })}
                        placeholder={translate("Optional", "اختياري")}
                        variant="unstyled"
                        radius={0}
                        styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Button
                        type="button"
                        variant="subtle"
                        color="gray"
                        size="xs"
                        radius="md"
                        p={6}
                        disabled={rows.length <= 1}
                        onClick={() => removeRow(row.key)}
                        title={translate("Remove row", "حذف الصف")}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-9">
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

        {error && <ErrorAlert error={error} />}

        <MmComponentsSection mmRows={mmRows} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {translate(
              "Add all materials required to manufacture one unit of this dimension.",
              "أضف كل المواد المطلوبة لتصنيع وحدة واحدة من هذا المقاس.",
            )}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="light"
              color="dark"
              radius="md"
              onClick={() => router.push(getLocalizedHref(`/products/${code}/boms/${dimensionId}`))}
            >
              {translation.cancel}
            </Button>
            <Button type="submit" loading={mutation.isPending} radius="md" color="teal">
              {translate("Create BOM", "إنشاء قائمة المواد")}
            </Button>
          </div>
        </div>
      </form>
    </LayoutBox>
  );
}
