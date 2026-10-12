"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button, NumberInput, Table, Textarea } from "@mantine/core";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import DateTimePickerInput from "@/components/ui/datetime-picker-input";
import ErrorAlert from "@/components/ui/error-alert";
import DataSelect from "@/components/ui/data-select";
import SelectMaterial from "@/components/global/selections/remote-based/select-material";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useUnsavedChangesWarning from "@/hooks/use-unsaved-changes-warning";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { getMaterialUnitSelectOptions, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { isRawMaterial, type MaterialType } from "@/lib/constants/enums/material-types";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import type { MaterialUnitConversionSummary, MaterialWithUnitConversionsSelection } from "@/types/material";

const PAGE_TITLE = { en: "Create Request for Quotation", ar: "إنشاء طلب عرض سعر" };

type ItemDraft = {
  key: string;
  materialCode: string | null;
  materialTitle: string;
  materialType: MaterialType | null;
  unitOfMeasurement: MaterialUnit | null;
  unitConversions: MaterialUnitConversionSummary[];
  unitOfMeasurementSelected: MaterialUnit | null;
  quantity: number | "";
  notes: string;
};

function createKey() {
  return `rfq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyRow(): ItemDraft {
  return {
    key: createKey(),
    materialCode: null,
    materialTitle: "",
    materialType: null,
    unitOfMeasurement: null,
    unitConversions: [],
    unitOfMeasurementSelected: null,
    quantity: "",
    notes: "",
  };
}

function toIso(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const href = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();
  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const [notes, setNotes] = useState("");
  const [responseDeadline, setResponseDeadline] = useState<string | null>(null);
  const [rows, setRows] = useState<ItemDraft[]>([emptyRow()]);
  const [error, setError] = useState("");

  const isDirty = notes.trim() !== "" || responseDeadline !== null || rows.some((row) => row.materialCode || row.quantity !== "");
  const confirmNavigation = useUnsavedChangesWarning(isDirty);

  const usedCodes = useMemo(
    () => rows.map((row) => row.materialCode).filter((code): code is string => !!code),
    [rows],
  );

  function updateRow(key: string, patch: Partial<ItemDraft>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function applyMaterial(key: string, material: MaterialWithUnitConversionsSelection | null) {
    if (!material) {
      updateRow(key, {
        materialCode: null,
        materialTitle: "",
        materialType: null,
        unitOfMeasurement: null,
        unitConversions: [],
        unitOfMeasurementSelected: null,
      });
      return;
    }
    updateRow(key, {
      materialCode: material.code,
      materialTitle: material.title,
      materialType: material.materialType,
      unitOfMeasurement: material.unitOfMeasurement,
      unitConversions: material.unitConversions ?? [],
      unitOfMeasurementSelected: material.unitOfMeasurement,
    });
  }

  const mutation = useMutation({
    mutationFn: () => {
      const items = rows.filter((row) => row.materialCode);
      if (items.length === 0) {
        throw new Error(translate("Add at least one material.", "أضف مادة واحدة على الأقل."));
      }
      for (const row of items) {
        if (!row.unitOfMeasurementSelected || row.quantity === "" || Number(row.quantity) <= 0) {
          throw new Error(translate("Each material needs a unit and a positive quantity.", "كل مادة تحتاج وحدة وكمية موجبة."));
        }
      }
      return requestForQuotationsApi.create({
        privateRequest,
        dto: {
          notes: notes.trim() || null,
          responseDeadline: toIso(responseDeadline),
          items: items.map((row) => ({
            materialCode: row.materialCode!,
            unitOfMeasurementSelected: row.unitOfMeasurementSelected!,
            quantityRequested: Number(row.quantity),
            notes: row.notes.trim() || null,
          })),
        },
      });
    },
    onSuccess: (created) => {
      router.push(href(`/procurement/requests-for-quotation/${created.id}`));
    },
    onError: (err) => setError(getErrorMessage(locale, err)),
  });

  return (
    <div className="flex min-h-full flex-col gap-5">
      <header className="flex items-center gap-3">
        <Button
          type="button"
          variant="light"
          color="dark"
          radius={20}
          p={0}
          h={40}
          w={40}
          onClick={() => {
            if (confirmNavigation()) router.push(href("/procurement/requests-for-quotation"));
          }}
          aria-label={translation.back}
        >
          <ArrowLeft size={18} style={{ transform: `rotateY(${translate("0deg", "180deg")})` }} />
        </Button>
        <h1>{translate(PAGE_TITLE.en, PAGE_TITLE.ar)}</h1>
      </header>

      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          mutation.mutate();
        }}
      >
        {error && <ErrorAlert error={error} />}

        <div className="grid gap-4 rounded-2xl bg-white p-5 md:grid-cols-2">
          <DateTimePickerInput
            label={translate("Response deadline", "آخر موعد للرد")}
            value={responseDeadline}
            onChange={setResponseDeadline}
            clearable
          />
          <Textarea
            label={translate("Notes", "ملاحظات")}
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            minRows={2}
            radius="md"
          />
        </div>

        <section className="overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold">{translate("Materials", "المواد")}</h2>
            <Button type="button" variant="light" color="haze" leftSection={<Plus size={14} />} onClick={() => setRows((current) => [...current, emptyRow()])}>
              {translate("Add material", "إضافة مادة")}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{translate("Material", "المادة")}</Table.Th>
                  <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                  <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                  <Table.Th>{translate("Notes", "ملاحظات")}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => {
                  const showUnits = !!row.materialType && isRawMaterial(row.materialType) && row.unitConversions.length > 0;
                  return (
                    <Table.Tr key={row.key}>
                      <Table.Td className="min-w-64">
                        <SelectMaterial
                          value={row.materialCode}
                          setValue={() => undefined}
                          onMaterialSelect={(material) => applyMaterial(row.key, material)}
                          excludeCodes={usedCodes.filter((code) => code !== row.materialCode)}
                          placeholder={translate("Select material", "اختر مادة")}
                        />
                      </Table.Td>
                      <Table.Td className="w-36">
                        <NumberInput
                          value={row.quantity}
                          onChange={(value) => updateRow(row.key, { quantity: value === "" ? "" : Number(value) })}
                          min={0}
                          hideControls
                          radius="md"
                        />
                      </Table.Td>
                      <Table.Td className="w-40">
                        {showUnits ? (
                          <UnitSelect row={row} locale={locale} onChange={(unit) => updateRow(row.key, { unitOfMeasurementSelected: unit })} />
                        ) : (
                          <span className="text-sm text-gray-600">
                            {row.unitOfMeasurement
                              ? getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale)[0]?.label
                              : translate("Unit", "الوحدة")}
                          </span>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <input
                          value={row.notes}
                          onChange={(event) => updateRow(row.key, { notes: event.target.value })}
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Button
                          type="button"
                          variant="subtle"
                          color="clay"
                          px={8}
                          disabled={rows.length === 1}
                          onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" color="haze" loading={mutation.isPending}>
            {translate("Save draft", "حفظ المسودة")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function UnitSelect({
  row,
  locale,
  onChange,
}: {
  row: ItemDraft;
  locale: Locale;
  onChange: (unit: MaterialUnit) => void;
}) {
  const options = getMaterialUnitSelectOptions(row.unitOfMeasurement, row.unitConversions, locale);
  return (
    <DataSelect
      value={row.unitOfMeasurementSelected}
      setValue={(next) => {
        if (next) onChange(next as MaterialUnit);
      }}
      data={options}
    />
  );
}
