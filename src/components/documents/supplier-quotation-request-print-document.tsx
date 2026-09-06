import { formatDate } from "@/lib/helpers/date-formaters";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { PrintSectionHeading, PrintTable } from "./components";

export type SupplierQuotationRequestItem = {
  materialTitle: string;
  materialCode: string;
  unitLabel: string;
  quantity: number;
  specifications: string | null;
};

export type SupplierQuotationRequestPrintDocumentProps = {
  documentLanguage: "ar" | "en";
  supplierDisplayName: string;
  notes: string | null;
  items: SupplierQuotationRequestItem[];
};

export default function SupplierQuotationRequestPrintDocument({
  documentLanguage,
  supplierDisplayName,
  notes,
  items,
}: SupplierQuotationRequestPrintDocumentProps) {
  const isArabic = documentLanguage === "ar";
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDate(new Date(), documentLanguage);

  const copy = isArabic
    ? {
        title: "طلب عرض سعر",
        dateLabel: "التاريخ",
        toLabel: "السادة شركة / مؤسسة",
        subjectLabel: "الموضوع",
        subject: "طلب عرض أسعار توريد أصناف",
        greeting: "تحية طيبة وبعد،",
        body: "نأمل من سيادتكم موافاتنا بعرض أسعاركم لتوريد الأصناف المبينة بالجدول أدناه إلى مصانعنا بمدينة العاشر من رمضان، مع بيان الأسعار وشروط وموعد التوريد، وذلك في أقرب وقت ممكن.",
        itemsHeading: "الأصناف المطلوبة",
        headers: ["م", "الصنف", "الكود", "المواصفات", "الوحدة", "الكمية"],
        emptyItems: "لا توجد أصناف",
        notesHeading: "ملاحظات إضافية",
        closing: "وتفضلوا بقبول فائق الاحترام والتقدير،",
        signature: "إدارة المشتريات",
        company: "مصانع العاشر من رمضان لمعدات التموين (MOG)",
      }
    : {
        title: "Request for Quotation",
        dateLabel: "Date",
        toLabel: "To",
        subjectLabel: "Subject",
        subject: "Request for Quotation (RFQ)",
        greeting: "Dear Sir/Madam,",
        body: "We would appreciate it if you could provide us with your best price quotation for supplying the items listed below to our factory in 10th of Ramadan City, including unit prices, delivery terms, and lead time, at your earliest convenience.",
        itemsHeading: "Requested Items",
        headers: ["#", "Item", "Code", "Specifications", "Unit", "Qty"],
        emptyItems: "No items",
        notesHeading: "Additional Notes",
        closing: "Yours sincerely,",
        signature: "Purchasing Department",
        company: "MOG - 10th of Ramadan Catering Equipment",
      };

  const rows = items.map((item, index) => [
    String(index + 1),
    item.materialTitle,
    item.materialCode,
    item.specifications || "-",
    item.unitLabel,
    formatQuantity(item.quantity),
  ]);

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`flex flex-col gap-5 text-xs text-gray-900 ${
        isArabic ? "font-(family-name:--font-alexandria)" : "font-(family-name:--font-google-sans)"
      }`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">{copy.company}</p>
          <h1 className="text-2xl font-semibold">{copy.title}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{copy.dateLabel}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded object-contain" />
      </header>

      <section className="flex flex-col gap-3 text-[11px] leading-relaxed">
        <p>
          <span className="font-semibold text-gray-700">{copy.toLabel}:</span> {supplierDisplayName}
        </p>
        <p>
          <span className="font-semibold text-gray-700">{copy.subjectLabel}:</span> {copy.subject}
        </p>
        <p className="pt-1">{copy.greeting}</p>
        <p className="text-justify">{copy.body}</p>
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading title={copy.itemsHeading} />
        <PrintTable
          headers={copy.headers}
          rows={rows}
          monoColumnIndexes={[2]}
          noWrapIndexes={[0, 2, 4, 5]}
          tableClassName="text-[9px] [&_td]:align-top"
          columnWidths={["6%", "28%", "12%", "30%", "12%", "12%"]}
          emptyLabel={copy.emptyItems}
        />
      </section>

      {notes ? (
        <section className="flex flex-col gap-1.5">
          <PrintSectionHeading title={copy.notesHeading} />
          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-gray-800">{notes}</p>
        </section>
      ) : null}

      <footer className="mt-4 flex flex-col gap-6 break-inside-avoid pt-2">
        <p className="text-[11px]">{copy.closing}</p>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-gray-900">{copy.signature}</p>
          <p className="text-[10px] text-gray-600">{copy.company}</p>
        </div>
      </footer>
    </div>
  );
}
