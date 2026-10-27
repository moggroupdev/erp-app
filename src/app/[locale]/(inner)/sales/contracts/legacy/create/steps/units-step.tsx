"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Dices } from "lucide-react";
import DatePickerInput from "@/components/ui/date-picker-input";
import Modal from "@/components/ui/modal";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { useI18n } from "@/lib/i18n/hooks";
import {
  isImportedSource,
  lineTitle,
  normalizeSerialDigits,
  selectedDimension,
  type ItemDraft,
  type UnitDraft,
} from "../form-state";

const FIELD_INPUT =
  "w-full min-w-0 bg-transparent py-2 text-sm font-medium text-gray-900 tabular-nums outline-none placeholder:font-normal placeholder:text-gray-400";

type UnitsStepProps = {
  items: ItemDraft[];
  setItems: Dispatch<SetStateAction<ItemDraft[]>>;
  clearStepError: () => void;
};

function createRandomSerial(used: Set<string>) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const serial = Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => String(byte % 10)).join("");
    if (!used.has(serial)) return serial;
  }
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => String(byte % 10)).join("");
}

export default function UnitsStep({ items, setItems, clearStepError }: UnitsStepProps) {
  const { translate, translation } = useI18n();
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
  const dimensionUnit = translation.productDimensionUnit;
  const unitTotal = items.reduce((sum, item) => sum + item.units.length, 0);
  const filledTotal = items.reduce(
    (sum, item) => sum + item.units.filter((unit) => unit.serialNumber.trim().length === 12).length,
    0,
  );
  const existingTotal = items.reduce(
    (sum, item) => sum + item.units.filter((unit) => unit.serialNumber.trim() !== "").length,
    0,
  );
  const allFilled = unitTotal > 0 && filledTotal === unitTotal;

  function patchUnit(itemKey: string, unitKey: string, patch: Partial<UnitDraft>) {
    setItems((current) =>
      current.map((row) =>
        row.key === itemKey
          ? {
              ...row,
              units: row.units.map((entry) => (entry.key === unitKey ? { ...entry, ...patch } : entry)),
            }
          : row,
      ),
    );
    clearStepError();
  }

  function usedSerials(exceptUnitKey?: string) {
    const used = new Set<string>();
    for (const item of items) {
      for (const unit of item.units) {
        if (exceptUnitKey && unit.key === exceptUnitKey) continue;
        const serial = unit.serialNumber.trim();
        if (serial) used.add(serial);
      }
    }
    return used;
  }

  function fillAllSerialNumbers() {
    setItems((current) => {
      const used = new Set<string>();
      return current.map((item) => ({
        ...item,
        units: item.units.map((unit) => {
          const serialNumber = createRandomSerial(used);
          used.add(serialNumber);
          return { ...unit, serialNumber };
        }),
      }));
    });
    clearStepError();
    closeConfirm();
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={[
              "shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
              allFilled ? "bg-teal-100 text-teal-700" : "bg-ochre-100 text-ochre-800",
            ].join(" ")}
          >
            {filledTotal}/{unitTotal}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {translate("Fill all serial numbers", "تعبئة جميع الأرقام التسلسلية")}
            </p>
            <p className="text-xs text-gray-500">
              {translate(
                "Assigns a unique 12-digit serial to every unit. Existing values are replaced.",
                "يعين رقمًا تسلسليًا فريدًا من 12 رقمًا لكل وحدة. تُستبدل القيم الحالية.",
              )}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="light"
          color="haze"
          leftSection={<Dices size={16} />}
          onClick={openConfirm}
          disabled={unitTotal === 0}
          className="shrink-0"
        >
          {translate("Fill all", "تعبئة الكل")}
        </Button>
      </div>

      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title={translate("Fill all serial numbers?", "تعبئة جميع الأرقام التسلسلية؟")}
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {translate(
              "A random 12-digit serial will be assigned to every unit.",
              "سيتم تعيين رقم تسلسلي عشوائي من 12 رقمًا لكل وحدة.",
            )}
          </p>

          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {translate("Units to fill", "الوحدات المراد تعبئتها")}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800">
              {translate(
                `${unitTotal} units across ${items.length} lines`,
                `${unitTotal} وحدة عبر ${items.length} بند`,
              )}
            </p>
          </div>

          {existingTotal > 0 ? (
            <p className="bg-ochre-50 text-ochre-800 rounded-lg px-3 py-2 text-xs font-medium">
              {translate(
                `${existingTotal} existing serials will be overwritten.`,
                `سيتم استبدال ${existingTotal} رقم تسلسلي موجود.`,
              )}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="light" color="dark" radius="md" onClick={closeConfirm} fullWidth>
              {translation.cancel}
            </Button>
            <Button type="button" color="haze" radius="md" onClick={fillAllSerialNumbers} fullWidth>
              {translate("Fill all", "تعبئة الكل")}
            </Button>
          </div>
        </div>
      </Modal>

      {items.map((item, index) => {
        const imported = isImportedSource(item.sourceType);
        const dimension = selectedDimension(item);
        const name = lineTitle(item);
        const filledCount = item.units.filter((unit) => unit.serialNumber.trim().length === 12).length;
        const unitCount = item.units.length;
        const allFilled = unitCount > 0 && filledCount === unitCount;

        return (
          <article key={item.key} className="overflow-hidden rounded-xl border border-gray-200">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="bg-haze-100 text-haze-700 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="truncate">{name || translate("Line", "البند")}</span>
                {dimension ? (
                  <span className="hidden truncate text-xs font-normal text-gray-500 sm:inline">
                    {formatDimensionLabelText(dimension, dimensionUnit)}
                  </span>
                ) : null}
                {imported ? (
                  <span className="bg-plum-100 text-plum-700 rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                    {translate("Imported", "مستورد")}
                  </span>
                ) : null}
              </h3>
              <div
                className={[
                  "shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
                  allFilled ? "bg-teal-100 text-teal-700" : "bg-ochre-100 text-ochre-800",
                ].join(" ")}
              >
                {filledCount}/{unitCount}
              </div>
            </header>

            <div className="divide-y divide-gray-100">
              {item.units.map((unit, unitIndex) => {
                const serialLen = unit.serialNumber.length;
                const serialComplete = serialLen === 12;

                return (
                  <div key={unit.key} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-12">
                    <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
                      <span
                        className={[
                          "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                          serialComplete ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500",
                        ].join(" ")}
                      >
                        {unitIndex + 1}
                      </span>
                      <span className="text-xs font-medium text-gray-500 xl:hidden">
                        {translate("Unit", "وحدة")} {unitIndex + 1}
                      </span>
                    </div>

                    <label className={imported ? "xl:col-span-4" : "sm:col-span-1 xl:col-span-6"}>
                      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-gray-600">
                        <span>
                          {translate("Serial number", "الرقم التسلسلي")}
                          <span className="text-clay-600"> *</span>
                        </span>
                        <span
                          className={["tabular-nums", serialComplete ? "font-semibold text-teal-700" : "text-gray-400"].join(
                            " ",
                          )}
                        >
                          {serialLen}/12
                        </span>
                      </span>
                      <div className="flex items-stretch gap-2">
                        <div
                          className={[
                            "focus-within:border-haze-600 focus-within:ring-haze-200 min-w-0 flex-1 rounded-lg border bg-white px-3 transition-colors focus-within:ring-1",
                            serialComplete ? "border-teal-200" : "border-gray-200",
                          ].join(" ")}
                        >
                          <TextInput
                            value={unit.serialNumber}
                            onChange={(event) => {
                              const serialNumber = normalizeSerialDigits(event.currentTarget.value).slice(0, 12);
                              patchUnit(item.key, unit.key, { serialNumber });
                            }}
                            placeholder={translate("12-digit unit serial", "رقم تسلسلي من 12 رقمًا")}
                            maxLength={12}
                            inputMode="numeric"
                            variant="unstyled"
                            required
                            classNames={{ input: FIELD_INPUT }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="light"
                          color="haze"
                          className="shrink-0 self-stretch"
                          onClick={() => {
                            const serialNumber = createRandomSerial(usedSerials(unit.key));
                            patchUnit(item.key, unit.key, { serialNumber });
                          }}
                          aria-label={translate("Generate serial number", "توليد رقم تسلسلي")}
                          title={translate("Generate serial number", "توليد رقم تسلسلي")}
                          px="sm"
                        >
                          <Dices size={14} />
                        </Button>
                      </div>
                    </label>

                    {imported ? (
                      <label className="xl:col-span-4">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">
                          {translate("Supplier serial", "مسلسل المورد")}
                          <span className="text-clay-600"> *</span>
                        </span>
                        <div className="focus-within:border-haze-600 focus-within:ring-haze-200 rounded-lg border border-gray-200 bg-white px-3 transition-colors focus-within:ring-1">
                          <TextInput
                            value={unit.supplierSerialNumber}
                            onChange={(event) => {
                              const supplierSerialNumber = event.currentTarget.value;
                              patchUnit(item.key, unit.key, { supplierSerialNumber });
                            }}
                            placeholder={translate("Serial number from the supplier", "الرقم التسلسلي كما هو لدى المورد")}
                            variant="unstyled"
                            required
                            classNames={{ input: FIELD_INPUT }}
                          />
                        </div>
                      </label>
                    ) : null}

                    <label className={imported ? "xl:col-span-3" : "xl:col-span-5"}>
                      <span className="mb-1.5 block text-xs font-medium text-gray-600">
                        {translate("Production end date", "تاريخ الانتهاء من الانتاج")}
                      </span>
                      <DatePickerInput
                        value={unit.producedAt}
                        onChange={(value) => patchUnit(item.key, unit.key, { producedAt: value })}
                        placeholder={translate(
                          "Leave empty if still in progress",
                          "اتركه فارغًا إذا كان الإنتاج لا يزال جاريًا",
                        )}
                        clearable
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
