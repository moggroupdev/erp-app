"use client";

import { ArrowUp, Boxes, Layers, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";

export default function CategoryStatsEmpty() {
  const { translate } = useI18n();

  const hints = [
    {
      icon: Boxes,
      label: translate("Overview totals", "إجماليات عامة"),
      detail: translate("Value, material count, and stock health", "القيمة وعدد المواد وصحة المخزون"),
    },
    {
      icon: Layers,
      label: translate("Composition", "التكوين"),
      detail: translate("Breakdown by type, stock status, and subcategory", "تفصيل حسب النوع وحالة المخزون والفئة الفرعية"),
    },
    {
      icon: ShieldAlert,
      label: translate("Attention lists", "قوائم المتابعة"),
      detail: translate("Highest-value items and materials below minimum", "أعلى المواد قيمة والمواد دون الحد الأدنى"),
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
            {translate("No category selected yet", "لم يتم اختيار فئة بعد")}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            {translate(
              "Pick a main category in the field above. The report will load totals, charts, and attention lists for that group only.",
              "اختر فئة رئيسية من الحقل أعلاه. سيُحمَّل التقرير بالإجماليات والمخططات وقوائم المتابعة لهذه المجموعة فقط.",
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

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-stone-200/80 bg-white p-3">
              <div className="mx-auto mt-2 h-16 w-16 rounded-full border-[6px] border-stone-100 border-t-stone-300" />
              <div className="mx-auto mt-3 h-2 w-16 rounded bg-stone-100" />
            </div>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-3">
              <div className="mx-auto mt-2 h-16 w-16 rounded-full border-[6px] border-stone-100 border-t-amber-200" />
              <div className="mx-auto mt-3 h-2 w-16 rounded bg-stone-100" />
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
