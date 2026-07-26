"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import bomsApi from "@/lib/api/boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatMoney } from "@/lib/helpers/format-money";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getDimensionUnitLabel } from "@/lib/constants/enums/dimension-units";
import type { Material } from "@/types/material";
import { Badge, Button, NumberInput, Table, TextInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import ErrorAlert from "@/components/ui/error-alert";
import SelectMaterial from "@/components/global/selections/query-based/select-material";

const PAGE_TITLE = { en: "Create BOM", ar: "إنشاء قائمة مواد" };

type BomDraftRow = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  unitPrice: number;
  quantityRequired: number | "";
  notes: string;
};

function createEmptyRow(): BomDraftRow {
  return {
    key: crypto.randomUUID(),
    materialCode: null,
    materialTitle: "",
    unitPrice: 0,
    quantityRequired: "",
    notes: "",
  };
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const { code, dimensionId } = useParams<{ code: string; dimensionId: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<BomDraftRow[]>([createEmptyRow()]);
  const [validationError, setValidationError] = useState("");
  const [duplicateCodes, setDuplicateCodes] = useState<Set<string>>(new Set());

  useDocumentTitle(`${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("BOM", "قائمة المواد")}`);

  const bomQuery = useQuery({
    queryKey: queryKeys.boms.detail(dimensionId),
    queryFn: ({ signal }) => bomsApi.getByDimension({ privateRequest, dimensionId, signal }),
    staleTime: staleTimes.boms,
  });

  const bom = bomQuery.data || null;
  const alreadyHasBom = (bom?.standardBoms.length ?? 0) > 0;

  useEffect(() => {
    if (alreadyHasBom) {
      router.replace(getLocalizedHref(`/products/${code}/boms/${dimensionId}`));
    }
  }, [alreadyHasBom, router, getLocalizedHref, code, dimensionId]);

  const mutation = useMutation({
    mutationFn: async () => {
      return await bomsApi.create({
        privateRequest,
        dto: {
          productDimensionId: dimensionId,
          items: rows.map((row) => ({
            materialCode: row.materialCode!,
            quantityRequired: Number(row.quantityRequired),
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

  const grandTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const qty = typeof row.quantityRequired === "number" ? row.quantityRequired : 0;
        return sum + qty * row.unitPrice;
      }, 0),
    [rows],
  );

  function updateRow(key: string, patch: Partial<BomDraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleMaterialSelect(key: string, material: Material | null) {
    updateRow(key, {
      materialCode: material?.code ?? null,
      materialTitle: material?.title ?? "",
      unitPrice: material?.unitPrice ?? 0,
    });
    setDuplicateCodes(new Set());
    setValidationError("");
  }

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

    for (const row of rows) {
      if (!row.materialCode) {
        return setValidationError(translate("Every row must have a material selected.", "يجب اختيار مادة لكل صف."));
      }
      const qty = Number(row.quantityRequired);
      if (row.quantityRequired === "" || Number.isNaN(qty) || qty <= 0) {
        return setValidationError(
          translate("Every row must have a positive quantity.", "يجب أن تكون الكمية موجبة في كل صف."),
        );
      }
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

  if (bomQuery.isFetching || alreadyHasBom) {
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
          ? `${bom.product.title} · ${bom.length} × ${bom.depth} × ${bom.height} ${getDimensionUnitLabel(bom.dimensionUnit, locale)}`
          : undefined,
        backLink: true,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-xl">
          <Table withColumnBorders>
            <Table.Thead className="bg-gray-50">
              <Table.Tr className="h-12">
                <Table.Th className="min-w-64 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Material", "المادة")}
                </Table.Th>
                <Table.Th className="min-w-28 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Quantity", "الكمية")}
                </Table.Th>
                <Table.Th className="min-w-28 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Unit Price", "سعر الوحدة")}
                </Table.Th>
                <Table.Th className="min-w-28 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Line Total", "إجمالي البند")}
                </Table.Th>
                <Table.Th className="min-w-40 text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {translate("Notes", "الملاحظات")}
                </Table.Th>
                <Table.Th className="w-12" />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, index) => {
                const qty = typeof row.quantityRequired === "number" ? row.quantityRequired : 0;
                const lineTotal = qty * row.unitPrice;
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
                      />
                    </Table.Td>
                    <Table.Td className="transition-colors focus-within:bg-teal-50/60">
                      <NumberInput
                        value={row.quantityRequired}
                        onChange={(value) => updateRow(row.key, { quantityRequired: value === "" ? "" : Number(value) })}
                        min={0}
                        allowNegative={false}
                        decimalScale={4}
                        hideControls
                        variant="unstyled"
                        radius={0}
                        placeholder={translate("Enter quantity...", "أدخل الكمية...")}
                        styles={{ input: { minHeight: 0, height: "auto", padding: 0 } }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm text-gray-600">
                        {row.materialCode ? formatMoney(row.unitPrice, currency) : "-"}
                      </span>
                    </Table.Td>
                    <Table.Td>
                      <span className="text-sm font-medium text-gray-600">
                        {row.materialCode ? formatMoney(lineTotal, currency) : "-"}
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
              <Table.Tr className="h-12">
                <Table.Td colSpan={2}>
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
                <Table.Td>
                  <Badge size="sm" variant="light" color="dark" radius="md">
                    {translate("Total", "الإجمالي")}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm font-semibold text-gray-800">{formatMoney(grandTotal, currency)}</span>
                </Table.Td>
                <Table.Td />
                <Table.Td />
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>

        {error && <ErrorAlert error={error} />}

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
