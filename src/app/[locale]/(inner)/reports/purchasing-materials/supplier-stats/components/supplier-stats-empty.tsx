"use client";

import { ArrowUp, Boxes, FileText, FolderTree, ShoppingCart, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";

export default function SupplierStatsEmpty() {
  const { translate } = useI18n();

  const hints = [
    {
      icon: ShoppingCart,
      label: translate("Overview totals", "إجماليات عامة"),
      detail: translate("Value, invoice count, and average order value", "القيمة وعدد الفواتير ومتوسط قيمة الطلب"),
    },
    {
      icon: TrendingUp,
      label: translate("Value trend", "اتجاه القيمة"),
      detail: translate("Total value per period for this supplier", "إجمالي القيمة لكل فترة لهذا المورد"),
    },
    {
      icon: FolderTree,
      label: translate("Categories", "الفئات"),
      detail: translate("Purchase value by main category with subcategory breakdown", "قيمة المشتريات حسب الفئة الرئيسية مع تفصيل الفئات الفرعية"),
    },
    {
      icon: FileText,
      label: translate("Purchase orders", "أوامر الشراء"),
      detail: translate("All purchase orders from this supplier", "جميع أوامر الشراء من هذا المورد"),
    },
    {
      icon: Boxes,
      label: translate("Purchased materials", "المواد المشتراة"),
      detail: translate("Materials purchased from this supplier", "المواد المشتراة من هذا المورد"),
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
            {translate("No supplier selected yet", "لم يتم اختيار مورد بعد")}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            {translate(
              "Pick a supplier in the field above. The report will load purchasing stats for that supplier only.",
              "اختر مورداً من الحقل أعلاه. سيُحمَّل التقرير بإحصائيات المشتريات لهذا المورد فقط.",
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
