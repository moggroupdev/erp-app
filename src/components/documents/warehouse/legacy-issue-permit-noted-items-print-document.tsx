import { useI18n } from "@/lib/i18n/hooks";
import { PrintAppliedFilters, PrintTable } from "../components";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import type { LegacyIssuePermitNotedItem } from "@/types/legacy-issue-permit";

export default function LegacyIssuePermitNotedItemsPrintDocument({
  items,
  appliedFilters = [],
}: {
  items: LegacyIssuePermitNotedItem[];
  appliedFilters?: { label: string; value: string }[];
}) {
  const { locale, translate } = useI18n();
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const headers = [
    translate("Permit", "الإذن"),
    translate("Date", "التاريخ"),
    translate("Code", "الكود"),
    translate("Material", "المادة"),
    translate("Quantity", "الكمية"),
    translate("Notes", "الملاحظات"),
  ];

  const rows = items.map((item) => {
    const permitMarks = [
      item.isSst ? "SST" : null,
      item.isCancelled ? translate("Cancelled", "ملغي") : null,
    ].filter(Boolean);

    const quantityLabel =
      item.quantity == null
        ? "-"
        : [
            formatQuantity(item.quantity),
            item.unitOfMeasurementSelected
              ? getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)
              : null,
          ]
            .filter(Boolean)
            .join(" ");

    return [
      <div key={`${item.itemId}-permit`} className="flex flex-col gap-0.5">
        <span className="font-mono">{item.issuePermitNumber}</span>
        {permitMarks.length > 0 && (
          <span className="text-[9px] text-gray-500">{permitMarks.join(" · ")}</span>
        )}
      </div>,
      formatDate(item.date, locale),
      item.materialCode || "-",
      item.materialCode
        ? item.materialTitle || item.materialCode
        : translate("Note only", "ملاحظة فقط"),
      quantityLabel,
      <span key={`${item.itemId}-notes`} className="whitespace-pre-wrap">
        {item.notes}
      </span>,
    ];
  });

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="flex items-start justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
            {translate("Legacy Issue Permits", "أذونات الصرف المرحلية")}
          </p>
          <h1 className="text-2xl font-semibold">
            {translate("Items with Notes", "بنود بملاحظات")}
          </h1>
          <p className="text-[10px] text-gray-500">{printedAt}</p>
        </div>
        <img src={logoSrc} alt="" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded object-contain" />
      </header>

      <PrintAppliedFilters filters={appliedFilters} />

      <PrintTable
        headers={headers}
        rows={rows}
        monoColumnIndexes={[0, 2]}
        noWrapIndexes={[0, 1, 2, 4]}
        tableClassName="break-before-avoid text-[9px] [&_td]:align-top"
        emptyLabel={translate("No items with notes", "لا توجد بنود بملاحظات")}
        columnWidths={["8%", "9%", "9%", "36%", "10%", "28%"]}
      />

      <footer className="mt-1 flex break-inside-avoid items-center justify-between gap-4 border-t border-gray-300 pt-3 text-[10px] text-gray-700">
        <span className="font-semibold tracking-wide uppercase">{translate("Document Total", "إجمالي المستند")}</span>
        <span>
          <span className="font-semibold text-gray-900">{items.length}</span>{" "}
          {translate("items", "بند")}
        </span>
      </footer>
    </div>
  );
}
