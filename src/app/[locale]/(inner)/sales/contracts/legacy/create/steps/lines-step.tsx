"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button, NumberInput, TextInput, Textarea } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import DataSelect from "@/components/ui/data-select";
import SelectProduct, { type SelectableProduct } from "@/components/global/selections/remote-based/select-product";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { useI18n } from "@/lib/i18n/hooks";
import { createEmptyItem, selectedDimension, type ItemDraft } from "../form-state";

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

  return (
    <section className="flex flex-col gap-4">
      {items.map((item, index) => {
        const dimension = selectedDimension(item);
        return (
          <article key={item.key} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-800">
                {translate("Line", "البند")} {index + 1}
              </h3>
              <Button
                type="button"
                variant="subtle"
                color="clay"
                size="compact-sm"
                leftSection={<Trash2 size={14} />}
                onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
              >
                {translate("Remove", "حذف")}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                className="md:col-span-2"
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
                label={translate("Unit price", "سعر الوحدة")}
                placeholder={translate("Enter unit price", "أدخل سعر الوحدة")}
                min={0}
                decimalScale={2}
                allowNegative={false}
                hideControls
                required
                radius="md"
              />
              <NumberInput
                value={item.quantity}
                onChange={(value) => updateQuantity(item.key, value)}
                label={translate("Quantity", "الكمية")}
                placeholder={translate("Enter quantity", "أدخل الكمية")}
                min={1}
                allowDecimal={false}
                allowNegative={false}
                required
                radius="md"
              />
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
                minRows={2}
                className="md:col-span-2"
              />
            </div>
            {dimension ? <p className="text-sm text-gray-500">{formatDimensionLabelText(dimension, dimensionUnit)}</p> : null}
          </article>
        );
      })}
      <Button
        type="button"
        variant="light"
        color="haze"
        leftSection={<Plus size={16} />}
        onClick={() => setItems((current) => [...current, createEmptyItem()])}
        className="self-start"
      >
        {translate("Add line", "إضافة بند")}
      </Button>
    </section>
  );
}
