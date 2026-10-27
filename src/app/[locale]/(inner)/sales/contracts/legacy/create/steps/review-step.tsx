"use client";

import dayjs from "dayjs";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import { selectedDimension, type ItemDraft } from "../form-state";

type ReviewStepProps = {
  customerName: string;
  customerCode: string;
  legacyNumber: string;
  legacyWorkOrderNumber: string;
  createdAt: string | null;
  startedAt: string | null;
  deliveryTime: string | null;
  totalAmount: number | null;
  items: ItemDraft[];
};

export default function ReviewStep({
  customerName,
  customerCode,
  legacyNumber,
  legacyWorkOrderNumber,
  createdAt,
  startedAt,
  deliveryTime,
  totalAmount,
  items,
}: ReviewStepProps) {
  const { locale, translate, translation } = useI18n();
  const dimensionUnit = translation.productDimensionUnit;

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-2">
        <SummaryItem label={translate("Customer", "العميل")} value={customerName ? `${customerName} - ${customerCode}` : ""} />
        <SummaryItem label={translate("Legacy contract review number", "رقم مراجعة العقد")} value={legacyNumber.trim()} />
        <SummaryItem label={translate("Legacy work order number", "رقم أمر الشغل")} value={legacyWorkOrderNumber.trim()} />
        <SummaryItem label={translate("Contract review date", "تاريخ مراجعة العقد")} value={formatPickerDate(createdAt, locale)} />
        <SummaryItem label={translate("Work order start", "بداية أمر الشغل")} value={formatPickerDate(startedAt, locale)} />
        <SummaryItem label={translate("Delivery date", "تاريخ التسليم")} value={formatPickerDate(deliveryTime, locale)} />
        <SummaryItem
          label={translate("Total", "الإجمالي")}
          value={totalAmount == null ? translate("Not priced", "غير مسعّر") : formatMoney(totalAmount)}
        />
      </div>
      {items.map((item, index) => {
        const dimension = selectedDimension(item);
        const quantity = Number(item.quantity) || 0;
        const priced = item.unitPrice !== "" && Number(item.unitPrice) > 0;
        const price = priced ? Number(item.unitPrice) : null;
        const produced = item.units.filter((unit) => unit.producedAt).length;
        const notPriced = translate("Not priced", "غير مسعّر");
        return (
          <article key={item.key} className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-gray-900">
                {index + 1}. {item.productTitle || translate("Untitled line", "بند بدون عنوان")}
              </h3>
              <span className="text-sm text-gray-600">{price == null ? notPriced : formatMoney(quantity * price)}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {item.productCode}
              {dimension ? ` · ${formatDimensionLabelText(dimension, dimensionUnit)}` : ""}
              {` · ${quantity} × ${price == null ? notPriced : formatMoney(price)}`}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {translate(`${item.units.length} units`, `${item.units.length} وحدات`)}
              {produced > 0
                ? ` · ${translate(`${produced} produced`, `${produced} تم إنتاجها`)}`
                : ` · ${translate("None marked produced", "لم يُحدد إنتاج")}`}
            </p>
            {item.notes.trim() ? <p className="mt-2 text-sm text-gray-700">{item.notes.trim()}</p> : null}
          </article>
        );
      })}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "-"}</p>
    </div>
  );
}

function formatPickerDate(value: string | null, locale: Locale) {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? formatDate(parsed.toDate(), locale) : "";
}
