"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button, NumberInput, Textarea } from "@mantine/core";
import { Minus, Plus, Trash2 } from "lucide-react";
import DataSelect from "@/components/ui/data-select";
import SelectProduct, { type SelectableProduct } from "@/components/global/selections/remote-based/select-product";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { formatMoney } from "@/lib/helpers/format-money";
import { useI18n } from "@/lib/i18n/hooks";
import { createEmptyItem, type ItemDraft } from "../form-state";

const ASIDE_INPUT =
  "w-full min-w-0 bg-transparent py-2.5 text-base font-semibold text-gray-900 tabular-nums outline-none placeholder:font-normal placeholder:text-gray-400";

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
    <section className="flex flex-col gap-3">
      {items.map((item, index) => {
        const amount = lineAmount(item);
        return (
          <article key={item.key} className="overflow-hidden rounded-xl border border-gray-200">
            <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <span className="bg-haze-100 text-haze-700 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="truncate">{item.productTitle || translate("Line", "البند")}</span>
              </h3>
              <Button
                type="button"
                variant="white"
                color="clay"
                size="sm"
                leftSection={<Trash2 size={14} />}
                onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                className="shrink-0"
              >
                {translate("Remove", "حذف")}
              </Button>
            </header>

            <div className="flex flex-col lg:flex-row">
              <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-3 p-4 sm:grid-cols-2">
                <SelectProduct
                  value={item.productCode}
                  setValue={(next) => {
                    const resolved = typeof next === "function" ? next(item.productCode) : next;
                    if (!resolved) applyProduct(item.key, null);
                  }}
                  onProductSelect={(product) => applyProduct(item.key, product)}
                  label={translate("Product", "المنتج")}
                  placeholder={translate("Search products", "ابحث عن المنتجات")}
                  withBrowseModal
                  withCreateInBrowse
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
                <Textarea
                  value={item.title}
                  onChange={(event) => {
                    const title = event.currentTarget.value;
                    setItems((current) => current.map((row) => (row.key === item.key ? { ...row, title } : row)));
                  }}
                  label={translate("Description", "البيان")}
                  placeholder={item.productTitle || translate("Line description", "بيان البند")}
                  radius="md"
                  autosize
                  minRows={2}
                  className="sm:col-span-2"
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
                  minRows={1}
                  className="sm:col-span-2"
                />
              </div>

              <aside className="flex w-full shrink-0 flex-col border-t border-gray-200 bg-gray-50 lg:w-80 lg:border-s lg:border-t-0">
                <div className="border-b border-gray-200 px-4 py-2.5">
                  <p className="text-xs font-semibold tracking-wide text-gray-500">
                    {translate("Line pricing", "تسعير البند")}
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-gray-600">
                      <span>
                        {translate("Unit price", "سعر الوحدة")}
                        <span className="text-clay-600"> *</span>
                      </span>
                      <span className="font-normal text-gray-400">{currency}</span>
                    </span>
                    <div className="focus-within:border-haze-600 focus-within:ring-haze-200 rounded-lg border border-gray-200 bg-white px-3 transition-colors focus-within:ring-1">
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
                        placeholder="0.00"
                        min={0}
                        decimalScale={2}
                        allowNegative={false}
                        hideControls
                        required
                        variant="unstyled"
                        classNames={{ input: ASIDE_INPUT }}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-gray-600">
                      {translate("Quantity", "الكمية")}
                      <span className="text-clay-600"> *</span>
                    </span>
                    <div className="focus-within:border-haze-600 focus-within:ring-haze-200 flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors focus-within:ring-1">
                      <button
                        type="button"
                        aria-label={translate("Decrease quantity", "إنقاص الكمية")}
                        disabled={item.quantity !== "" && Number(item.quantity) <= 1}
                        onClick={() => {
                          const current = item.quantity === "" ? 1 : Number(item.quantity);
                          updateQuantity(item.key, Math.max(1, current - 1));
                        }}
                        className="flex w-10 shrink-0 items-center justify-center border-e border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) => updateQuantity(item.key, value)}
                        placeholder="1"
                        min={1}
                        allowDecimal={false}
                        allowNegative={false}
                        hideControls
                        required
                        variant="unstyled"
                        classNames={{ input: `${ASIDE_INPUT} px-2! text-center` }}
                      />
                      <button
                        type="button"
                        aria-label={translate("Increase quantity", "زيادة الكمية")}
                        onClick={() => {
                          const current = item.quantity === "" ? 0 : Number(item.quantity);
                          updateQuantity(item.key, current + 1);
                        }}
                        className="flex w-10 shrink-0 items-center justify-center border-s border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </label>

                  <div className="mt-auto rounded-lg bg-white px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-haze-700 text-xs font-medium">{translate("Amount", "المبلغ")}</p>
                      <p className="text-haze-600/80 text-xs">{currency}</p>
                    </div>
                    <p className="text-haze-700 mt-1 text-xl font-semibold tracking-tight tabular-nums">
                      {amount == null ? "-" : formatMoney(amount)}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </article>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
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
          <p className="text-haze-700 text-base font-semibold tabular-nums">{formatMoney(totalAmount)}</p>
        </div>
      </div>
    </section>
  );
}

function lineAmount(item: ItemDraft) {
  if (item.unitPrice === "" || item.quantity === "") return null;
  return Number(item.unitPrice) * Number(item.quantity);
}
