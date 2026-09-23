import { useI18n } from "@/lib/i18n/hooks";
import { PrintDetail, PrintTable } from "../../components";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type { MaterialPurchaseOrderDetailed } from "@/types/material-purchase-order";

const VAT_RATE = 0.14;

const GENERAL_TERMS = [
  {
    ar: "شروط الدفع: كالسابق.",
    en: "Payment terms: as previously agreed.",
  },
  {
    ar: "مكان التسليم: مصانعنا بالعاشر من رمضان.",
    en: "Delivery location: our factories in 10th of Ramadan.",
  },
  {
    ar: "التوريد يخضع لقواعد وأحكام قانون الضريبة على الأرباح التجارية والصناعية وضريبة القيمة المضافة.",
    en: "Supply is subject to the rules and provisions of the tax on commercial and industrial profits and value-added tax.",
  },
  {
    ar: "يتم تقديم فاتورة موضح بها أرقام أمر التوريد والبيانات الضريبية.",
    en: "An invoice must be submitted showing the purchase order numbers and the tax details.",
  },
  {
    ar: "يتم توقيع غرامات تأخير بواقع 1% عن كل يوم تأخير بحد أقصى 10%.",
    en: "Delay penalties of 1% per day of delay shall apply, up to a maximum of 10%.",
  },
  {
    ar: "للشركة الحق في رفض الأصناف المخالفة للمواصفات وشروط التوريد.",
    en: "The company reserves the right to reject items that do not conform to the specifications and supply terms.",
  },
  {
    ar: "لا يتم إجراء أي تعديل على أمر التوريد إلا بناء على خطاب معتمد.",
    en: "No amendment to the purchase order shall be made except pursuant to an approved letter.",
  },
  {
    ar: "الشروط الخاصة الأخرى طبقاً للمرفق الذي يعتبر جزءاً من أمر التوريد.",
    en: "Other special terms shall be in accordance with the attachment, which forms part of the purchase order.",
  },
] as const;

type MaterialPurchaseOrderPrintDocumentProps = {
  order: MaterialPurchaseOrderDetailed;
};

function PrintOrgHeader() {
  return (
    <div className="flex flex-col gap-2 font-semibold">
      <p className="text-xs text-gray-800">موج العاشر من رمضـــــان</p>
      <p className="text-xs text-gray-800">إدارة المشتريات والمخـازن</p>
      <p className="text-xs text-gray-800">المخــــــــزن الرئيســـــــــــــــي</p>
    </div>
  );
}

export default function MaterialPurchaseOrderPrintDocument({ order }: MaterialPurchaseOrderPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const subtotal = Number(order.totalAmount);
  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;

  const itemHeaders = [
    translate("Material", "الصنف"),
    translate("Code", "الكود"),
    translate("Unit", "الوحدة"),
    translate("Qty Ordered", "الكمية المطلوبة"),
    translate(`Unit Price (${currency})`, `سعر الوحدة (${currency})`),
    translate(`Subtotal (${currency})`, `المجموع الفرعي (${currency})`),
    translate("Notes", "الملاحظات"),
  ];

  const itemRows = order.items.map((item) => {
    const lineSubtotal = Number(item.quantityOrdered) * Number(item.unitPrice);

    return [
      item.material.title,
      item.material.code,
      getMaterialUnitLabel(item.unitOfMeasurementSelected, locale),
      formatQuantity(item.quantityOrdered),
      formatMoney(item.unitPrice),
      formatMoney(lineSubtotal),
      item.notes || "",
    ];
  });

  const itemFooterRows = [
    [translate(`Total (${currency})`, `الإجمالي (${currency})`), "", "", "", "", formatMoney(subtotal), ""],
    [translate("VAT (14%)", "ضريبة القيمة المضافة (14%)"), "", "", "", "", formatMoney(vat), ""],
    [translate(`Grand Total (${currency})`, `الإجمالي الكلي (${currency})`), "", "", "", "", formatMoney(grandTotal), ""],
  ];

  const isArabic = locale === "ar";
  const generalTerms = GENERAL_TERMS.map((term) => (isArabic ? term.ar : term.en));

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="relative flex items-center justify-between gap-4 border-b border-gray-300 pb-2">
        <PrintOrgHeader />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
              {translate("Materials Purchase Order", "أمر توريد خامات")}
            </p>
            <h1 className="font-mono text-2xl font-semibold">{order.code}</h1>
          </div>
        </div>
        <img src={logoSrc} alt="" width={100} height={100} className="h-24 w-24 shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4">
        <PrintDetail label={translate("Printing Date", "تاريخ الطباعة")} value={printedAt} />
        <PrintDetail label={translate("PO Date", "تاريخ أمر التوريد")} value={formatDateAndTime(order.createdAt, locale)} />
        <PrintDetail label={translate("Supplier", "المورد")} value={order.supplier.name} />
        {order.notes ? <PrintDetail label={translate("Notes", "الملاحظات")} value={order.notes} /> : null}
      </section>

      <hr className="border-gray-300" />

      <section className="flex flex-col gap-2.5">
        <PrintTable
          headers={itemHeaders}
          rows={itemRows}
          footerRows={itemFooterRows}
          monoColumnIndexes={[1]}
          noWrapIndexes={[1, 2, 3, 4, 5]}
          tableClassName="text-[8px] [&_td]:align-top [&_th]:text-[8px]"
          emptyLabel={translate("No items in this order", "لا توجد بنود في هذا الأمر")}
        />
      </section>

      <section
        className="flex break-inside-avoid flex-col gap-2 border-t border-gray-300 pt-3"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <h2 className="text-sm font-semibold text-gray-900">{translate("General Terms:", "القواعد العامة:")}</h2>
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-[11px] leading-relaxed text-gray-800">
          {generalTerms.map((term, index) => (
            <li key={term} className="flex gap-2">
              <span className="shrink-0 font-medium tabular-nums">{index + 1}.</span>
              <span>{term}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
