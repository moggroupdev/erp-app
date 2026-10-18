"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button, NumberInput, Textarea, TextInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import DataSelect from "@/components/ui/data-select";
import SelectProduct, { type SelectableProduct } from "@/components/global/selections/remote-based/select-product";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { formatMoney } from "@/lib/helpers/format-money";
import { useI18n } from "@/lib/i18n/hooks";
import { createEmptyItem, lineTitle, type ItemDraft } from "../form-state";

const LABEL_WRAP = { label: { whiteSpace: "normal" as const } };

type LinesStepProps = {
  items: ItemDraft[];
  setItems: Dispatch<SetStateAction<ItemDraft[]>>;
  applyProduct: (key: string, product: SelectableProduct | null) => void;
  updateQuantity: (key: string, raw: number | string) => void;
  clearStepError: () => void;
};

export default function LinesStep({ items, setItems, applyProduct, updateQuantity, clearStepError }: LinesStepProps) {
  const { translate, translation } = useI18n();
  const dimensionUnit = translation.productDimensionUnit;
  const currency = translation.currency;
  const totalAmount = items.reduce((sum, item) => sum + (lineAmount(item) ?? 0), 0);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200">
      {items.map((item, index) => {
        const amount = lineAmount(item);
        const name = lineTitle(item);
        return (
          <article key={item.key} className="border-b border-gray-200">
            <div className="flex items-center justify-between gap-3 px-4 pt-3">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-haze-50 px-1.5 text-xs font-semibold text-haze-700">
                  {index + 1}
                </span>
                <span className="truncate">{name || translate("Line", "البند")}</span>
              </h3>
              <Button
                type="button"
                variant="subtle"
                color="clay"
                size="compact-sm"
                leftSection={<Trash2 size={14} />}
                onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                className="shrink-0"
              >
                {translate("Remove", "حذف")}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <SelectProduct
                value={item.productCode}
                setValue={(next) => {
                  const resolved = typeof next === "function" ? next(item.productCode) : next;
                  if (!resolved) applyProduct(item.key, null);
                }}
                onProductSelect={(product) => applyProduct(item.key, product)}
                label={translate("Product", "المنتج")}
                placeholder={translate("Search products", "ابحث عن المنتجات")}
                required
                className="sm:col-span-2"
              />
              <DataSelect
                value={item.productDimensionId}
                setValue={(next) => {
                  const resolved = typeof next === "function" ? next(item.productDimensionId) : next;
                  setItems((current) =>
                    current.map((row) => (row.key === item.key ? { ...row, productDimensionId: resolved } : row)),
                  );
                  clearStepError();
                }}
                data={item.dimensions.map((option) => ({
                  value: option.id,
                  label: formatDimensionLabelText(option, dimensionUnit),
                }))}
                label={translate("Dimension", "المقاس")}
                placeholder={
                  item.productCode
                    ? translate("Choose a dimension", "اختر مقاسًا")
                    : translate("Choose a product first", "اختر منتجًا أولاً")
                }
                disabled={!item.productCode || item.dimensions.length === 0}
                required
              />
              <TextInput
                value={item.title}
                onChange={(event) => {
                  const title = event.currentTarget.value;
                  setItems((current) => current.map((row) => (row.key === item.key ? { ...row, title } : row)));
                }}
                label={translate("Title", "العنوان")}
                placeholder={item.productTitle || translate("Line title", "عنوان البند")}
                radius="md"
              />
              <NumberInput
                value={item.unitPrice}
                onChange={(value) => {
                  setItems((current) =>
                    current.map((row) =>
                      row.key === item.key ? { ...row, unitPrice: value === "" ? "" : Number(value) } : row,
                    ),
                  );
                  clearStepError();
                }}
                label={translate(`Unit price (${currency})`, `سعر الوحدة (${currency})`)}
                placeholder="0.00"
                min={0}
                decimalScale={2}
                allowNegative={false}
                hideControls
                required
                radius="md"
                styles={LABEL_WRAP}
              />
              <NumberInput
                value={item.quantity}
                onChange={(value) => updateQuantity(item.key, value)}
                label={translate("Quantity", "الكمية")}
                placeholder="1"
                min={1}
                allowDecimal={false}
                allowNegative={false}
                required
                radius="md"
                styles={LABEL_WRAP}
              />
              <div>
                <p className="mb-[5px] text-sm font-medium">{translate(`Amount (${currency})`, `المبلغ (${currency})`)}</p>
                <div className="flex h-9 items-center rounded-md bg-haze-50 px-3 text-sm font-semibold text-haze-700 tabular-nums">
                  {amount == null ? "-" : formatMoney(amount)}
                </div>
              </div>
              <Textarea
                value={item.notes}
                onChange={(event) => {
                  const notes = event.currentTarget.value;
                  setItems((current) => current.map((row) => (row.key === item.key ? { ...row, notes } : row)));
                }}
                label={translate("Notes", "ملاحظات")}
                placeholder={translate("Optional notes", "ملاحظات اختيارية")}
                radius="md"
                autosize
                minRows={1}
              />
            </div>
          </article>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3">
        <Button
          type="button"
          variant="light"
          color="haze"
          leftSection={<Plus size={16} />}
          onClick={() => setItems((current) => [...current, createEmptyItem()])}
        >
          {translate("Add line", "إضافة بند")}
        </Button>
        <div className="text-end">
          <p className="text-xs text-gray-500">{translate(`Total (${currency})`, `الإجمالي (${currency})`)}</p>
          <p className="text-base font-semibold text-haze-700 tabular-nums">{formatMoney(totalAmount)}</p>
        </div>
      </div>
    </section>
  );
}

function lineAmount(item: ItemDraft) {
  if (item.unitPrice === "" || item.quantity === "") return null;
  return Number(item.unitPrice) * Number(item.quantity);
}
