"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button, Table, TextInput, Textarea } from "@mantine/core";
import DatePickerInput from "@/components/ui/date-picker-input";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { useI18n } from "@/lib/i18n/hooks";
import { applyPastedSerials, isImportedSource, lineTitle, selectedDimension, type ItemDraft } from "../form-state";

type UnitsStepProps = {
  items: ItemDraft[];
  setItems: Dispatch<SetStateAction<ItemDraft[]>>;
  pasteDrafts: Record<string, string>;
  setPasteDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  pasteNotes: Record<string, string>;
  setPasteNotes: Dispatch<SetStateAction<Record<string, string>>>;
  clearStepError: () => void;
};

export default function UnitsStep({
  items,
  setItems,
  pasteDrafts,
  setPasteDrafts,
  pasteNotes,
  setPasteNotes,
  clearStepError,
}: UnitsStepProps) {
  const { translate, translation } = useI18n();
  const dimensionUnit = translation.productDimensionUnit;

  return (
    <section className="flex flex-col gap-4">
      {items.map((item, index) => {
        const imported = isImportedSource(item.sourceType);
        const dimension = selectedDimension(item);
        return (
          <article key={item.key} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {translate("Line", "البند")} {index + 1}
                {lineTitle(item) ? ` · ${lineTitle(item)}` : ""}
              </h3>
              <p className="text-sm text-gray-500">
                {dimension ? formatDimensionLabelText(dimension, dimensionUnit) : item.productCode}
                {item.quantity !== "" ? ` · ${item.quantity}` : ""}
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed" verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w="8%">#</Table.Th>
                    <Table.Th w={imported ? "34%" : "46%"}>{translate("Serial number", "الرقم التسلسلي")}</Table.Th>
                    {imported ? <Table.Th w="30%">{translate("Supplier serial", "مسلسل المورد")}</Table.Th> : null}
                    <Table.Th w={imported ? "28%" : "46%"}>{translate("Produced", "الإنتاج")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {item.units.map((unit, unitIndex) => (
                    <Table.Tr key={unit.key}>
                      <Table.Td className="text-gray-500">{unitIndex + 1}</Table.Td>
                      <Table.Td>
                        <TextInput
                          value={unit.serialNumber}
                          onChange={(event) => {
                            const serialNumber = event.currentTarget.value.replace(/\D/g, "").slice(0, 12);
                            setItems((current) =>
                              current.map((row) =>
                                row.key === item.key
                                  ? {
                                      ...row,
                                      units: row.units.map((entry) =>
                                        entry.key === unit.key ? { ...entry, serialNumber } : entry,
                                      ),
                                    }
                                  : row,
                              ),
                            );
                            clearStepError();
                          }}
                          placeholder="000000000000"
                          maxLength={12}
                          inputMode="numeric"
                          radius="md"
                          required
                        />
                      </Table.Td>
                      {imported ? (
                        <Table.Td>
                          <TextInput
                            value={unit.supplierSerialNumber}
                            onChange={(event) => {
                              const supplierSerialNumber = event.currentTarget.value;
                              setItems((current) =>
                                current.map((row) =>
                                  row.key === item.key
                                    ? {
                                        ...row,
                                        units: row.units.map((entry) =>
                                          entry.key === unit.key ? { ...entry, supplierSerialNumber } : entry,
                                        ),
                                      }
                                    : row,
                                ),
                              );
                              clearStepError();
                            }}
                            placeholder={translate("Supplier serial", "مسلسل المورد")}
                            radius="md"
                            required
                          />
                        </Table.Td>
                      ) : null}
                      <Table.Td>
                        <DatePickerInput
                          value={unit.producedAt}
                          onChange={(value) => {
                            setItems((current) =>
                              current.map((row) =>
                                row.key === item.key
                                  ? {
                                      ...row,
                                      units: row.units.map((entry) =>
                                        entry.key === unit.key ? { ...entry, producedAt: value } : entry,
                                      ),
                                    }
                                  : row,
                              ),
                            );
                          }}
                          placeholder={translate("Optional", "اختياري")}
                          clearable
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <Textarea
                value={pasteDrafts[item.key] ?? ""}
                onChange={(event) => setPasteDrafts((current) => ({ ...current, [item.key]: event.currentTarget.value }))}
                label={translate("Paste serials", "لصق الأرقام التسلسلية")}
                placeholder={translate("One 12-digit serial per line", "رقم تسلسلي من 12 رقمًا في كل سطر")}
                autosize
                minRows={2}
                radius="md"
                className="flex-1"
              />
              <Button
                type="button"
                variant="light"
                color="haze"
                onClick={() => {
                  const result = applyPastedSerials(item, pasteDrafts[item.key] ?? "");
                  setItems((current) => current.map((row) => (row.key === item.key ? result.item : row)));
                  setPasteNotes((current) => ({
                    ...current,
                    [item.key]:
                      result.extra > 0
                        ? translate(`${result.extra} extra serials were ignored.`, `تم تجاهل ${result.extra} أرقام زائدة.`)
                        : "",
                  }));
                  clearStepError();
                }}
              >
                {translate("Fill serials", "تعبئة الأرقام")}
              </Button>
            </div>
            {pasteNotes[item.key] ? <p className="text-sm text-gray-500">{pasteNotes[item.key]}</p> : null}
          </article>
        );
      })}
    </section>
  );
}
