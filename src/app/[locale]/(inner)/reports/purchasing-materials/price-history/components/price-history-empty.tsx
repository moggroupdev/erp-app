"use client";

import { ArrowUp, TrendingUp, Table2, BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";

export default function PriceHistoryEmpty() {
  const { translate } = useI18n();

  const hints = [
    {
      icon: TrendingUp,
      label: translate("Price trend", "اتجاه السعر"),
      detail: translate("Unit price over time across purchase orders", "سعر الوحدة عبر الوقت عبر أوامر الشراء"),
    },
    {
      icon: Table2,
      label: translate("Order details", "تفاصيل الطلبات"),
      detail: translate("Each purchase with supplier, price, and quantity", "كل عملية شراء مع المورد والسعر والكمية"),
    },
    {
      icon: BarChart3,
      label: translate("Summary stats", "إحصائيات ملخصة"),
      detail: translate("Min, max, average price and change percentage", "الحد الأدنى والأقصى ومتوسط السعر ونسبة التغيير"),
    },
  ];

  return (
    <section className="overflow-hidden rounded-3xl bg-white">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center border-b border-dashed border-stone-200 px-6 py-8 sm:px-8 lg:border-e lg:border-b-0">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-medium tracking-wide text-stone-600 uppercase">
            <ArrowUp size={12} className="opacity-70" />
            {translate("Selection required", "مطلوب اختيار")}
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-stone-800 sm:text-xl">
            {translate("No material selected yet", "لم يتم اختيار مادة بعد")}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            {translate(
              "Pick a material in the field above. The report will load its price history across all purchase orders.",
              "اختر مادة من الحقل أعلاه. سيُحمَّل تاريخ أسعارها عبر جميع أوامر الشراء.",
            )}
          </p>

          <ul className="mt-8 space-y-6">
            {hints.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-stone-800">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-stone-50/70 px-6 py-8 sm:px-8">
          <p className="mb-4 text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
            {translate("What you will see", "ما ستراه")}
          </p>

          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-stone-200/80 bg-white p-3">
                <div className="h-2 w-8 rounded bg-stone-200" />
                <div className="mt-3 h-5 w-12 rounded bg-stone-100" />
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-2xl border border-stone-200/80 bg-white p-3">
            <div className="flex items-end gap-1 h-16">
              {[30, 45, 35, 55, 50, 60, 48].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-stone-100" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="mt-2 rounded-2xl border border-stone-200/80 bg-white p-3">
            <div className="space-y-2">
              {[72, 54, 40].map((width) => (
                <div key={width} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-stone-200" />
                  <div className="h-2 rounded bg-stone-100" style={{ width: `${width}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
