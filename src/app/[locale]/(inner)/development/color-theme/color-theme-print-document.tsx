"use client";

import PrintDocument from "@/components/ui/print-document";
import { colorTheme, colorThemeOrder, type ColorThemeName } from "@/lib/constants/color-theme";
import { APP_NAME } from "@/lib/constants/global";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { useI18n } from "@/lib/i18n/hooks";

const shadeOrder = [50, 100, 200, 600, 700] as const;

const usageRules = [
  {
    en: "Use color to convey meaning, not merely to decorate.",
    ar: "استخدم اللون لنقل المعنى، وليس للزخرفة فقط.",
  },
  {
    en: "Keep neutral gray for structure, metadata, and inactive controls.",
    ar: "استخدم الرمادي المحايد للبنية والبيانات الوصفية والعناصر غير النشطة.",
  },
  {
    en: "Pair every status color with text or an icon so color is never the only signal.",
    ar: "اربط كل لون حالة بنص أو أيقونة حتى لا يكون اللون هو الإشارة الوحيدة.",
  },
  {
    en: "Reserve plum for categories and data visualization; do not use it for success or errors.",
    ar: "خصص اللون البرقوقي للتصنيفات والرسوم البيانية، ولا تستخدمه للنجاح أو الأخطاء.",
  },
];

function PrintColorSection({
  colorName,
  translate,
}: {
  colorName: ColorThemeName;
  translate: (en: string, ar: string) => string;
}) {
  const color = colorTheme[colorName];

  return (
    <section className="break-inside-avoid">
      <div className="flex items-center justify-between gap-3 pb-2">
        <h2 className="text-sm font-semibold text-gray-900">{translate(color.label.en, color.label.ar)}</h2>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: color.shades[50], color: color.shades[700] }}
        >
          {translate(color.role.en, color.role.ar)}
        </span>
      </div>

      <div className="grid grid-cols-5">
        {shadeOrder.map((shade) => (
          <div
            key={shade}
            className="flex min-h-16 flex-col justify-between px-2 py-1.5"
            style={{
              backgroundColor: color.shades[shade],
              color: shade >= 600 ? "#ffffff" : color.shades[700],
            }}
          >
            <span className="text-[10px] font-semibold">{shade}</span>
            <span className="font-mono text-[9px] uppercase">{color.shades[shade]}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <p className="leading-5 text-gray-700">{translate(color.usage.en, color.usage.ar)}</p>
        <div className="flex flex-wrap gap-1">
          {color.examples.map((example) => (
            <span
              key={example.en}
              className="rounded px-1.5 py-0.5 text-[9px] font-medium"
              style={{ backgroundColor: color.shades[50], color: color.shades[700] }}
            >
              {translate(example.en, example.ar)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div
            className="rounded px-2 py-1.5 text-center text-[10px] font-semibold text-white"
            style={{ backgroundColor: color.shades[600] }}
          >
            {translate(color.examples[0].en, color.examples[0].ar)}
          </div>
          <div
            className="rounded px-2 py-1.5 text-center text-[10px] font-semibold"
            style={{ backgroundColor: color.shades[100], color: color.shades[700] }}
          >
            {translate(color.examples[1].en, color.examples[1].ar)}
          </div>
          <div
            className="rounded px-2 py-1.5 text-center text-[10px] font-medium"
            style={{ backgroundColor: color.shades[200], color: color.shades[700] }}
          >
            {translate(color.examples[2].en, color.examples[2].ar)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ColorThemePrintDocument() {
  const { locale, translate } = useI18n();
  const printedAt = formatDateAndTime(new Date(), locale);

  return (
    <PrintDocument
      title={translate("Color Theme", "نظام الألوان")}
      buttonLabel={translate("Print color system", "طباعة نظام الألوان")}
      buttonType="button"
      paperWidth={210}
      paperHeight={297}
    >
      <div className="flex flex-col gap-4 text-[11px] text-gray-900">
        <header className="flex items-end justify-between gap-4 pb-3">
          <div>
            <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">{APP_NAME}</p>
            <h1 className="text-xl font-semibold text-gray-900">{translate("Color Theme", "نظام الألوان")}</h1>
            <p className="mt-1 text-[10px] text-gray-500">
              {translate(
                "A4 reference for the proposed semantic palette.",
                "مرجع A4 للوحة الألوان الدلالية المقترحة.",
              )}
            </p>
          </div>
          <p className="shrink-0 text-[10px] text-gray-500">{printedAt}</p>
        </header>

        <p className="leading-5 text-gray-600">
          {translate(
            "Shade 50 is for soft surfaces, 100 and 200 for stronger washes, 600 for filled controls, and 700 for text and hover states.",
            "الدرجة 50 للأسطح الهادئة، و100 و200 للخلفيات الأقوى، و600 للعناصر المعبأة، و700 للنصوص وحالات المرور.",
          )}
        </p>

        {colorThemeOrder.map((colorName, index) => (
          <div key={colorName}>
            {index > 0 && <hr className="my-4 border-t border-dashed border-gray-300" />}
            <PrintColorSection colorName={colorName} translate={translate} />
          </div>
        ))}

        <hr className="border-t border-dashed border-gray-300" />

        <section className="break-inside-avoid">
          <h2 className="text-sm font-semibold text-gray-900">{translate("Usage rules", "قواعد الاستخدام")}</h2>
          <ul className="mt-2 flex list-inside list-disc flex-col gap-1 leading-5 text-gray-700">
            {usageRules.map((rule) => (
              <li key={rule.en}>{translate(rule.en, rule.ar)}</li>
            ))}
          </ul>
        </section>
      </div>
    </PrintDocument>
  );
}
