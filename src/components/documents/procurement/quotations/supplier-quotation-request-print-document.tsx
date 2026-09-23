import { Mail, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { PrintSectionHeading, PrintTable } from "../../components";

export type SupplierQuotationRequestItem = {
  materialTitle: string;
  materialCode: string;
  unitLabel: string;
  quantity: number;
  specifications: string | null;
};

export type SupplierQuotationRequestContact = {
  name: string;
  email: string | null;
  phone: string | null;
};

type SignatureBlockProps = {
  contact: SupplierQuotationRequestContact;
  title: string;
  companyName: string;
};

function SignatureBlock({ contact, title, companyName }: SignatureBlockProps) {
  const details = [
    contact.email ? { icon: Mail, value: contact.email } : null,
    contact.phone ? { icon: Phone, value: contact.phone } : null,
  ].filter((row): row is { icon: typeof Mail; value: string } => !!row);

  return (
    <div className="flex min-w-48 flex-1 flex-col gap-1 border-s-2 border-teal-800 ps-3">
      <p className="mb-1.5 text-sm font-semibold text-gray-900">{contact.name}</p>
      <p className="text-[10px] text-gray-600">
        {title}
        <span className="mx-1.5 text-gray-300">·</span>
        {companyName}
      </p>
      {details.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          {details.map(({ icon: Icon, value }) => (
            <span key={value} className="inline-flex items-center gap-1.5 text-[10px] text-gray-700">
              <Icon size={11} className="shrink-0 text-teal-800" aria-hidden />
              <span className="break-all">{value}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type SupplierQuotationRequestPrintDocumentProps = {
  supplierDisplayName: string;
  supplierContactName?: string | null;
  notes: string | null;
  items: SupplierQuotationRequestItem[];
  preparedBy: SupplierQuotationRequestContact;
  purchasingDepartmentManager?: SupplierQuotationRequestContact | null;
};

export default function SupplierQuotationRequestPrintDocument({
  supplierDisplayName,
  supplierContactName,
  notes,
  items,
  preparedBy,
  purchasingDepartmentManager,
}: SupplierQuotationRequestPrintDocumentProps) {
  const { locale, translate } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDate(new Date(), locale);
  const companyName = translate("MOG 10th of Ramadan Company", "شركة موج العاشر من رمضان");
  const showSpecifications = items.some((item) => !!item.specifications?.trim());

  const headers = [
    translate("#", "م"),
    translate("Item", "الصنف"),
    translate("Code", "الكود"),
    ...(showSpecifications ? [translate("Specifications", "المواصفات")] : []),
    translate("Unit", "الوحدة"),
    translate("Qty", "الكمية"),
  ];

  const rows = items.map((item, index) => [
    String(index + 1),
    item.materialTitle,
    item.materialCode,
    ...(showSpecifications ? [item.specifications || "-"] : []),
    item.unitLabel,
    formatQuantity(item.quantity),
  ]);

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">{companyName}</p>
          <h1 className="text-2xl font-semibold">{translate("Request for Quotation", "طلب عرض سعر")}</h1>
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-600">{translate("Date", "التاريخ")}:</span> {printedAt}
          </p>
        </div>
        <img src={logoSrc} alt="" width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded object-contain" />
      </header>

      <section className="flex flex-col gap-3 text-[11px] leading-relaxed">
        <p>
          <span className="font-semibold text-gray-700">{translate("To", "السادة شركة / مؤسسة")}:</span>{" "}
          {supplierDisplayName}
        </p>
        {supplierContactName?.trim() ? (
          <p>
            <span className="font-semibold text-gray-700">{translate("Attn", "عناية السيد")}:</span>{" "}
            {supplierContactName.trim()}
          </p>
        ) : null}
        <p>
          <span className="font-semibold text-gray-700">{translate("Subject", "الموضوع")}:</span>{" "}
          {translate("Request for Quotation for the Supply of Materials", "طلب عرض أسعار لتوريد أصناف")}
        </p>
        <p className="pt-1">{translate("Dear Sir/Madam,", "تحية طيبة وبعد،")}</p>
        <p className="leading-relaxed">
          {translate(
            "We kindly request that you provide us with a price quotation for the supply of the materials listed in the table below to our factories in 10th of Ramadan City, specifying payment terms and delivery lead time.",
            "نرجو من سيادتكم التكرم بموافاتنا بعرض أسعاركم لتوريد الأصناف المبينة في الجدول أدناه إلى مصانعنا بمدينة العاشر من رمضان موضحًا شروط السداد ومدة التوريد.",
          )}
        </p>
      </section>

      <section className="flex flex-col gap-2.5">
        <PrintSectionHeading title={translate("Requested Items", "الأصناف المطلوبة")} />
        <PrintTable
          headers={headers}
          rows={rows}
          monoColumnIndexes={[2]}
          noWrapIndexes={showSpecifications ? [0, 2, 4, 5] : [0, 2, 3, 4]}
          tableClassName="text-[9px] [&_td]:align-top"
          columnWidths={showSpecifications ? ["6%", "28%", "12%", "30%", "12%", "12%"] : ["6%", "46%", "16%", "16%", "16%"]}
          emptyLabel={translate("No items", "لا توجد أصناف")}
        />
      </section>

      {notes ? (
        <section className="flex flex-col gap-1.5">
          <PrintSectionHeading title={translate("Additional Notes", "ملاحظات إضافية")} />
          <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-gray-800">{notes}</p>
        </section>
      ) : null}

      <footer className="mt-6 flex break-inside-avoid flex-col gap-4 border-t border-gray-300 pt-4">
        <p className="text-[11px] leading-relaxed">
          {translate(
            "We look forward to receiving your quotation. Yours sincerely,",
            "وتفضلوا بقبول فائق الاحترام والتقدير،",
          )}
        </p>

        <div className="flex flex-wrap items-start gap-6">
          <SignatureBlock
            contact={preparedBy}
            title={translate("Purchasing Department", "إدارة المشتريات")}
            companyName={companyName}
          />
          {purchasingDepartmentManager?.name ? (
            <SignatureBlock
              contact={purchasingDepartmentManager}
              title={translate("Purchasing Department Manager", "مدير إدارة المشتريات")}
              companyName={companyName}
            />
          ) : null}
        </div>
      </footer>
    </div>
  );
}
