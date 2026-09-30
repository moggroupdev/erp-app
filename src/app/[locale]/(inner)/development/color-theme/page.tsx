import { Alert, Badge, Button, Progress, Tabs, TabsList, TabsTab, TextInput, ThemeIcon } from "@mantine/core";
import { CircleAlert, FileText, Info, PackageSearch, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import LayoutBox from "@/components/ui/layout-box";
import { colorTheme, colorThemeOrder, type ColorThemeName } from "@/lib/constants/color-theme";
import ColorThemePrintDocument from "./color-theme-print-document";
import type { LocalePageProps } from "@/lib/i18n/types";
import { getI18nFromParams } from "@/lib/i18n/utils";

const semanticExamples: ColorThemeName[] = ["teal", "haze", "ochre", "clay", "plum"];
const shadeOrder = [50, 100, 200, 600, 700] as const;

function PaletteCard({
  colorName,
  translate,
}: {
  colorName: ColorThemeName;
  translate: (en: string, ar: string) => string;
}) {
  const color = colorTheme[colorName];

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{translate(color.label.en, color.label.ar)}</h2>
          <p className="mt-1 text-xs text-gray-500">{translate(color.role.en, color.role.ar)}</p>
        </div>
        <Badge radius="md" variant="light" color={colorName} className="shrink-0 normal-case">
          {translate(color.role.en, color.role.ar)}
        </Badge>
      </div>

      <div className="grid grid-cols-5 border-y border-gray-200">
        {shadeOrder.map((shade) => (
          <div
            key={shade}
            className="flex min-h-20 flex-col justify-between p-2"
            style={{
              backgroundColor: color.shades[shade],
              color: shade >= 600 ? "#ffffff" : color.shades[700],
            }}
          >
            <span className="text-[11px] font-semibold">{shade}</span>
            <span className="font-mono text-[10px] uppercase">{color.shades[shade]}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs leading-6 text-gray-600">{translate(color.usage.en, color.usage.ar)}</p>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            {translate("ERP use cases", "أمثلة استخدام في النظام")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {color.examples.map((example) => (
              <li
                key={example.en}
                className="rounded-md px-2 py-1 text-[11px] font-medium"
                style={{ backgroundColor: color.shades[50], color: color.shades[700] }}
              >
                {translate(example.en, example.ar)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function ComponentSpecimen({
  colorName,
  translate,
}: {
  colorName: ColorThemeName;
  translate: (en: string, ar: string) => string;
}) {
  const color = colorTheme[colorName];

  if (colorName === "teal") {
    return (
      <article className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <SpecimenHeader colorName={colorName} translate={translate} />
        <Button color="teal">{translate(color.examples[0].en, color.examples[0].ar)}</Button>
        <TextInput label={translate("Requisition code", "كود طلب الشراء")} value="MPR-2026-0042" readOnly color="teal" />
        <Tabs defaultValue="all" variant="outline" color="teal">
          <TabsList>
            <TabsTab value="all">{translate("All", "الكل")}</TabsTab>
            <TabsTab value="active">{translate("Active", "نشط")}</TabsTab>
          </TabsList>
        </Tabs>
      </article>
    );
  }

  if (colorName === "haze") {
    return (
      <article className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <SpecimenHeader colorName={colorName} translate={translate} />
        <Alert color="haze" icon={<Info size={16} />} title={translate("Invoice PDF attached", "تم إرفاق ملف PDF للفاتورة")}>
          {translate("The source document is available to view or download.", "المستند المصدر متاح للعرض أو التنزيل.")}
        </Alert>
        <Button variant="light" color="haze" leftSection={<FileText size={15} />}>
          {translate("View audit history", "عرض سجل التدقيق")}
        </Button>
        <TextInput
          label={translate("System note", "ملاحظة النظام")}
          value={translate("Imported from spreadsheet", "تم الاستيراد من جدول بيانات")}
          readOnly
          color="haze"
        />
      </article>
    );
  }

  if (colorName === "ochre") {
    return (
      <article className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <SpecimenHeader colorName={colorName} translate={translate} />
        <Alert
          color="ochre"
          icon={<CircleAlert size={16} />}
          title={translate("Pending manager approval", "بانتظار اعتماد المدير")}
        >
          {translate("The requisition cannot proceed until it is approved.", "لا يمكن متابعة طلب الشراء حتى يتم اعتماده.")}
        </Alert>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-ochre-50 p-3 text-ochre-700">
          <span className="text-xs font-medium">{translate("Low-stock level", "مستوى المخزون المنخفض")}</span>
          <Badge color="ochre" radius="md">
            25%
          </Badge>
        </div>
        <Progress value={25} size="lg" radius="xl" color="ochre" />
      </article>
    );
  }

  if (colorName === "clay") {
    return (
      <article className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <SpecimenHeader colorName={colorName} translate={translate} />
        <Alert color="clay" icon={<CircleAlert size={16} />} title={translate("Submission rejected", "تم رفض الإرسال")}>
          {translate("Correct the highlighted fields before submitting again.", "صحح الحقول المحددة قبل إعادة الإرسال.")}
        </Alert>
        <TextInput
          label={translate("Invoice number", "رقم الفاتورة")}
          value="INV-1427"
          error={translate("This invoice number already exists", "رقم الفاتورة مستخدم بالفعل")}
          readOnly
          color="clay"
        />
        <Button color="clay" leftSection={<Trash2 size={15} />}>
          {translate("Delete purchase order", "حذف أمر التوريد")}
        </Button>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <SpecimenHeader colorName={colorName} translate={translate} />
      <div className="flex items-center gap-3 rounded-lg bg-plum-50 p-3 text-plum-700">
        <ThemeIcon variant="filled" radius="md" color="plum">
          <PackageSearch size={16} />
        </ThemeIcon>
        <div>
          <p className="text-xs font-semibold">{translate("Production department", "قسم إنتاج")}</p>
          <p className="mt-0.5 text-[11px] opacity-80">{translate("Category label", "وسم تصنيف")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {color.examples.slice(1, 4).map((example) => (
          <Badge key={example.en} radius="md" variant="light" color="plum" className="normal-case">
            {translate(example.en, example.ar)}
          </Badge>
        ))}
      </div>
      <div className="flex flex-col gap-2 text-plum-700">
        <div className="flex items-center justify-between text-xs">
          <span>{translate("Materials report", "تقرير المواد")}</span>
          <span>64%</span>
        </div>
        <Progress value={64} size="lg" radius="xl" color="plum" />
      </div>
    </article>
  );
}

function SpecimenHeader({ colorName, translate }: { colorName: ColorThemeName; translate: (en: string, ar: string) => string }) {
  const color = colorTheme[colorName];

  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-gray-800">{translate(color.label.en, color.label.ar)}</h3>
      <Badge radius="md" variant="light" color={colorName} className="normal-case">
        {translate(color.role.en, color.role.ar)}
      </Badge>
    </div>
  );
}

export default async function Page({ params }: LocalePageProps) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { translate } = await getI18nFromParams(params);

  return (
    <LayoutBox
      header={{
        title: translate("Color Theme Lab", "مختبر ألوان الواجهة"),
        subTitle: translate(
          "Development preview of the registered semantic palette (Mantine + Tailwind).",
          "معاينة تطويرية للوحة الألوان الدلالية المسجلة (Mantine + Tailwind).",
        ),
        backLink: true,
        sideElements: <ColorThemePrintDocument />,
      }}
    >
      <main className="flex flex-col gap-8">
        <section className="rounded-xl bg-teal-50 p-4 sm:p-5">
          <p className="text-sm font-semibold text-teal-800">
            {translate(
              "All five semantic colors are registered in the shared theme.",
              "الألوان الدلالية الخمسة مسجلة في الثيم المشترك.",
            )}
          </p>
          <p className="mt-1 text-xs text-teal-700">
            {translate(
              "Use this page to verify Mantine variants and Tailwind tokens before rolling changes into feature screens.",
              "استخدم هذه الصفحة للتحقق من متغيرات Mantine ورموز Tailwind قبل تطبيق التغييرات على شاشات النظام.",
            )}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{translate("Palette", "لوحة الألوان")}</h2>
            <p className="mt-1 text-xs text-gray-500">
              {translate(
                "Each family has restrained surface shades and two accessible working shades.",
                "تحتوي كل مجموعة على درجات هادئة للأسطح ودرجتين واضحتين للاستخدام العملي.",
              )}
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {colorThemeOrder.map((colorName) => (
              <PaletteCard key={colorName} colorName={colorName} translate={translate} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              {translate("Component treatment", "استخدامها في المكونات")}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {translate(
                "Real Mantine component examples using each color according to its semantic role.",
                "أمثلة فعلية لمكونات Mantine تستخدم كل لون وفقًا لدوره الدلالي.",
              )}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {semanticExamples.map((colorName) => (
              <ComponentSpecimen key={colorName} colorName={colorName} translate={translate} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-800">{translate("Usage rules", "قواعد الاستخدام")}</h2>
            <ul className="mt-3 flex list-inside list-disc flex-col gap-2 text-xs leading-6 text-gray-600">
              <li>
                {translate(
                  "Use color to convey meaning, not merely to decorate.",
                  "استخدم اللون لنقل المعنى، وليس للزخرفة فقط.",
                )}
              </li>
              <li>
                {translate(
                  "Keep neutral gray for structure, metadata, and inactive controls.",
                  "استخدم الرمادي المحايد للبنية والبيانات الوصفية والعناصر غير النشطة.",
                )}
              </li>
              <li>
                {translate(
                  "Pair every status color with text or an icon so color is never the only signal.",
                  "اربط كل لون حالة بنص أو أيقونة حتى لا يكون اللون هو الإشارة الوحيدة.",
                )}
              </li>
              <li>
                {translate(
                  "Reserve plum for categories and data visualization; do not use it for success or errors.",
                  "خصص اللون البرقوقي للتصنيفات والرسوم البيانية، ولا تستخدمه للنجاح أو الأخطاء.",
                )}
              </li>
            </ul>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-800">
              {translate("Recommended semantic mapping", "التوزيع الدلالي المقترح")}
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
              {colorThemeOrder.map((colorName) => {
                const color = colorTheme[colorName];
                return (
                  <div key={colorName} className="contents">
                    <dt className="font-semibold" style={{ color: color.shades[700] }}>
                      {translate(color.label.en, color.label.ar)}
                    </dt>
                    <dd className="text-gray-600">{translate(color.role.en, color.role.ar)}</dd>
                  </div>
                );
              })}
            </dl>
          </article>
        </section>
      </main>
    </LayoutBox>
  );
}
