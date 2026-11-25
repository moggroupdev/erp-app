import { useI18n } from "@/lib/i18n/hooks";
import { PrintAppliedFilters, PrintTable } from "../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import type { Customer } from "@/types/customer";
import { getCustomerClassificationLabel } from "@/lib/constants/enums/customer-classifications";

export default function CustomersListPrintDocument({
  customers,
  appliedFilters = [],
}: {
  customers: Customer[];
  appliedFilters?: { label: string; value: string }[];
}) {
  const hasFilters = appliedFilters.length > 0;
  const { locale, translate } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const headers = [
    translate("Code", "الكود"),
    translate("Name", "الاسم"),
    translate("Classification", "التصنيف"),
    translate("Phone", "الهاتف"),
    translate("Email", "البريد الإلكتروني"),
    translate("Registration Date", "تاريخ التسجيل"),
  ];

  const rows = customers.map((customer) => [
    customer.code,
    customer.name,
    customer.classification ? getCustomerClassificationLabel(customer.classification, locale) : "-",
    customer.phone || "-",
    customer.email || "-",
    formatDate(customer.createdAt, locale),
  ]);

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Customers List", "قائمة العملاء")}
          </p>
          <h1 className="text-2xl font-semibold">
            {hasFilters
              ? translate("Selected Customers", "العملاء المحددون")
              : translate("All Customers", "جميع العملاء")}
          </h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <PrintAppliedFilters filters={appliedFilters} />

      <PrintTable
        headers={headers}
        rows={rows}
        monoColumnIndexes={[0]}
        noWrapIndexes={[0, 3, 5]}
        tableClassName="break-before-avoid text-[9px] [&_td]:align-top"
        emptyLabel={translate("No customers", "لا يوجد عملاء")}
      />

      <footer className="mt-1 flex break-inside-avoid items-center justify-between gap-4 border-t border-gray-300 pt-3 text-[10px] text-gray-700">
        <span className="font-semibold tracking-wide uppercase">{translate("Document Total", "إجمالي المستند")}</span>
        <span>
          <span className="font-semibold text-gray-900">{customers.length}</span> {translate("customers", "عميل")}
        </span>
      </footer>
    </div>
  );
}
