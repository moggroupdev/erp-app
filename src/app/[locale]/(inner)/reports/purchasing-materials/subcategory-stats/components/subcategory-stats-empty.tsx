"use client";

import { ArrowUp, FileClock, Files, ShoppingCart, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";

export default function SubCategoryStatsEmpty() {
  const { translate } = useI18n();

  const hints = [
    {
      icon: ShoppingCart,
      label: translate("Overview totals", "إجماليات عامة"),
      detail: translate("Value, invoice count, and average order value", "القيمة وعدد الفواتير ومتوسط قيمة الطلب"),
    },
    {
      icon: Truck,
      label: translate("Suppliers", "الموردون"),
      detail: translate("Ranked by value and by invoice count", "مرتّبون حسب القيمة وعدد الفواتير"),
    },
    {
      icon: FileClock,
      label: translate("Latest invoices", "أحدث الفواتير"),
      detail: translate("Recent purchase orders in this subcategory", "أحدث أوامر التوريد ضمن هذه الفئة الفرعية"),
    },
    {
      icon: Files,
      label: translate("Top materials", "أعلى المواد"),
      detail: translate("Materials with the highest purchase value", "المواد ذات أعلى قيمة شراء"),
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
            {translate("No subcategory selected yet", "لم يتم اختيار فئة فرعية بعد")}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            {translate(
              "Pick a main category, then a subcategory in the fields above. The report will load purchasing stats for that subcategory only.",
              "اختر فئة رئيسية ثم فئة فرعية من الحقول أعلاه. سيُحمَّل التقرير بإحصائيات المشتريات لهذه الفئة الفرعية فقط.",
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

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-stone-200/80 bg-white p-3">
                <div className="h-2 w-8 rounded bg-stone-200" />
                <div className="mt-3 h-5 w-12 rounded bg-stone-100" />
              </div>
            ))}
          </div>

          <div className="mt-2 space-y-2">
            {[88, 64, 48].map((width) => (
              <div key={width} className="rounded-2xl border border-stone-200/80 bg-white p-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-stone-200" />
                  <div className="h-2 rounded bg-stone-100" style={{ width: `${width}%` }} />
                </div>
              </div>
            ))}
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
