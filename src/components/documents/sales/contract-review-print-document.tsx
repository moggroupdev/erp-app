import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/types";
import { PrintDetail, PrintSectionHeading, PrintTable } from "../components";
import useLocations from "@/hooks/reference/use-locations";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatDimensionLabelText } from "@/lib/helpers/format-dimension-label";
import { formatMoney } from "@/lib/helpers/format-money";
import type { ContractDetailed, ContractItem, ContractProductUnit } from "@/types/contract";

export type ContractReviewPrintVariant = "items" | "units";

type ContractReviewPrintDocumentProps = {
  contract: ContractDetailed;
  variant?: ContractReviewPrintVariant;
};

type UnitColumnKey =
  | "supplierSerialNumber"
  | "producedAt"
  | "receivedAt"
  | "deliveredAt"
  | "installedAt"
  | "warrantyStartedAt"
  | "cancelledAt"
  | "notes";

const UNIT_COLUMNS: {
  key: UnitColumnKey;
  label: { en: string; ar: string };
}[] = [
  { key: "supplierSerialNumber", label: { en: "Supplier serial", ar: "مسلسل المورد" } },
  { key: "producedAt", label: { en: "Production end", ar: "انتهاء الإنتاج" } },
  { key: "receivedAt", label: { en: "Received", ar: "الاستلام" } },
  { key: "deliveredAt", label: { en: "Delivered", ar: "التسليم" } },
  { key: "installedAt", label: { en: "Installed", ar: "التركيب" } },
  { key: "warrantyStartedAt", label: { en: "Warranty start", ar: "بداية الضمان" } },
  { key: "cancelledAt", label: { en: "Cancelled", ar: "الإلغاء" } },
  { key: "notes", label: { en: "Notes", ar: "الملاحظات" } },
];

function unitHasValue(unit: ContractProductUnit, key: UnitColumnKey) {
  const value = unit[key];
  return typeof value === "string" ? value.trim().length > 0 : !!value;
}

function visibleUnitColumns(units: ContractProductUnit[]) {
  return UNIT_COLUMNS.filter((column) => units.some((unit) => unitHasValue(unit, column.key)));
}

/** Shared % widths so unit tables align across contract lines (same column set). */
function unitTableColumnWidths(columnCount: number): string[] {
  if (columnCount <= 0) return [];
  if (columnCount === 1) return ["100%"];

  const serialPct = 14;
  const remainingPct = 100 - serialPct;
  const otherPct = remainingPct / (columnCount - 1);
  return [`${serialPct}%`, ...Array.from({ length: columnCount - 1 }, () => `${otherPct}%`)];
}

function formatUnitCell(unit: ContractProductUnit, key: UnitColumnKey, locale: Locale) {
  const value = unit[key];
  if (key === "supplierSerialNumber" || key === "notes") {
    return value?.toString().trim() || "-";
  }
  if (!value) return "-";
  return formatDateAndTime(value, locale);
}

function PrintOrgHeader() {
  const { translate } = useI18n();

  return (
    <div className="flex flex-col gap-0.5 font-semibold">
      <p className="text-xs text-gray-800">{translate("MOG Companies Group", "مجموعة شركات مـــوج")}</p>
      <p className="text-xs text-gray-800">{translate("MOG 10th of Ramadan", "موج العاشر من رمضان")}</p>
      <p className="text-xs text-gray-800">{translate("Sales Department", "إدارة المبيعــــــــــــــــــــات")}</p>
    </div>
  );
}

function ContractItemPrintBlock({
  item,
  index,
  locale,
  currency,
  dimensionUnit,
  unitColumns,
  translate,
}: {
  item: ContractItem;
  index: number;
  locale: Locale;
  currency: string;
  dimensionUnit: string;
  unitColumns: typeof UNIT_COLUMNS;
  translate: (en: string, ar: string) => string;
}) {
  const lineTitle = item.title?.trim() || "";
  const cancelled = !!item.cancelledAt;
  const lineAmount = item.unitPrice == null ? null : item.quantity * item.unitPrice;
  const units = item.productUnits;

  const unitHeaders = [
    translate("Serial", "الرقم المسلسل"),
    ...unitColumns.map((column) => translate(column.label.en, column.label.ar)),
  ];
  const columnWidths = unitTableColumnWidths(unitHeaders.length);

  const unitRows = units.map((unit) => [
    unit.serialNumber,
    ...unitColumns.map((column) => formatUnitCell(unit, column.key, locale)),
  ]);

  const monoColumnIndexes = [
    0,
    ...unitColumns.flatMap((column, columnIndex) => (column.key === "supplierSerialNumber" ? [columnIndex + 1] : [])),
  ];

  return (
    <section className="flex break-inside-avoid flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <PrintSectionHeading
          title={
            <span className="flex flex-wrap items-center gap-2">
              <span>
                {index + 1}. {item.product.title}
              </span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-700">
                {item.product.code}
              </span>
              {cancelled ? (
                <span className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                  {translate("Cancelled", "ملغي")}
                </span>
              ) : null}
            </span>
          }
        />
        {lineTitle ? <p className="py-1 text-[11px] leading-relaxed text-gray-600">{lineTitle}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4 [&>div>span:last-child]:text-[11px]">
        <PrintDetail
          label={translate("Dimension", "المقاس")}
          value={formatDimensionLabelText(item.productDimension, dimensionUnit)}
        />
        <PrintDetail label={translate("Quantity", "الكمية")} value={String(item.quantity)} />
        <PrintDetail
          label={translate(`Unit Price (${currency})`, `سعر الوحدة (${currency})`)}
          value={item.unitPrice == null ? translate("Not priced", "غير مسعّر") : formatMoney(item.unitPrice)}
        />
        <PrintDetail
          label={translate(`Line Total (${currency})`, `إجمالي البند (${currency})`)}
          value={lineAmount == null ? translate("Not priced", "غير مسعّر") : formatMoney(lineAmount)}
        />
        {item.notes?.trim() ? <PrintDetail label={translate("Notes", "الملاحظات")} value={item.notes.trim()} /> : null}
        {item.cancellationReason?.trim() ? (
          <PrintDetail label={translate("Cancellation reason", "سبب الإلغاء")} value={item.cancellationReason.trim()} />
        ) : null}
      </div>

      {units.length > 0 ? (
        <PrintTable
          headers={unitHeaders}
          rows={unitRows}
          columnWidths={columnWidths}
          monoColumnIndexes={monoColumnIndexes}
          noWrapIndexes={unitHeaders.map((_, headerIndex) => headerIndex)}
          tableClassName="text-[8px] [&_td]:align-top [&_th]:text-[8px]"
          emptyLabel={translate("No units on this line", "لا توجد وحدات في هذا البند")}
        />
      ) : null}
    </section>
  );
}

function ContractItemsPrintTable({
  items,
  currency,
  dimensionUnit,
  translate,
}: {
  items: ContractItem[];
  currency: string;
  dimensionUnit: string;
  translate: (en: string, ar: string) => string;
}) {
  const showNotes = items.some((item) => !!item.notes?.trim() || !!item.cancellationReason?.trim());

  const headers = [
    "#",
    translate("Product", "المنتج"),
    translate("Description", "البيان"),
    translate("Quantity", "الكمية"),
    translate(`Unit Price (${currency})`, `سعر الوحدة (${currency})`),
    translate(`Line Total (${currency})`, `إجمالي البند (${currency})`),
    ...(showNotes ? [translate("Notes", "الملاحظات")] : []),
  ];

  const columnWidths = showNotes
    ? ["4%", "20%", "26%", "7%", "11%", "11%", "21%"]
    : ["4%", "24%", "31%", "8%", "16%", "17%"];

  const rows = items.map((item, index) => {
    const lineTitle = item.title?.trim() || "-";
    const cancelled = !!item.cancelledAt;
    const noteParts = [
      item.notes?.trim() || "",
      item.cancellationReason?.trim()
        ? `${translate("Cancellation reason", "سبب الإلغاء")}: ${item.cancellationReason.trim()}`
        : "",
    ].filter(Boolean);

    return [
      String(index + 1),
      <span className="flex flex-col gap-0.5">
        <span className="font-mono text-gray-600">{item.product.code}</span>
        <span className="leading-relaxed">{item.product.title}</span>
        <span className="text-gray-600">{formatDimensionLabelText(item.productDimension, dimensionUnit)}</span>
      </span>,
      cancelled ? (
        <span className="leading-relaxed">
          {lineTitle}{" "}
          <span className="text-[9px] font-semibold tracking-wide text-gray-500 uppercase">
            {translate("Cancelled", "ملغي")}
          </span>
        </span>
      ) : (
        <span className="leading-relaxed">{lineTitle}</span>
      ),
      String(item.quantity),
      item.unitPrice == null ? translate("Not priced", "غير مسعّر") : formatMoney(item.unitPrice),
      item.unitPrice == null ? translate("Not priced", "غير مسعّر") : formatMoney(item.quantity * item.unitPrice),
      ...(showNotes
        ? [
            <span key="notes" className="whitespace-pre-line">
              {noteParts.join("\n") || "-"}
            </span>,
          ]
        : []),
    ];
  });

  const lineTotalIndex = 5;
  const footer = headers.map(() => "");
  footer[1] = translate(`Total (${currency})`, `الإجمالي (${currency})`);
  const pricedTotal = items.reduce<number | null>((sum, item) => {
    if (item.cancelledAt) return sum;
    if (sum == null || item.unitPrice == null) return null;
    return sum + item.quantity * item.unitPrice;
  }, 0);
  footer[lineTotalIndex] = pricedTotal == null ? translate("Not priced", "غير مسعّر") : formatMoney(pricedTotal);

  return (
    <PrintTable
      headers={headers}
      rows={rows}
      footerRow={footer}
      columnWidths={columnWidths}
      noWrapIndexes={[0, 3, 4, 5]}
      tableClassName="border-hidden text-[9px] [&_tr]:border-0 [&_td]:border [&_td]:border-gray-200 [&_td]:align-top [&_th]:border [&_th]:border-gray-200 [&_th]:text-[8px]"
      emptyLabel={translate("No items on this contract review", "لا توجد بنود في مراجعة العقد هذه")}
    />
  );
}

export default function ContractReviewPrintDocument({ contract, variant = "units" }: ContractReviewPrintDocumentProps) {
  const { locale, translate, translation } = useI18n();
  const { helpers } = useLocations();
  const currency = translation.currency;
  const dimensionUnit = translation.productDimensionUnit;
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/images/logo.png` : "/images/logo.png";
  const printedAt = formatDateAndTime(new Date(), locale);

  const address = contract.deliveryAddress;
  const country = address ? helpers.getCountryById(address.countryId) : null;
  const governorate = address?.cityId ? helpers.getGovernorateOfCity(address.cityId) : null;
  const city = address?.cityId ? helpers.getCityById(address.cityId) : null;
  const locationText = [
    country ? translate(country.nameEn, country.nameAr) : null,
    governorate ? translate(governorate.nameEn, governorate.nameAr) : null,
    city ? translate(city.nameEn, city.nameAr) : null,
  ]
    .filter(Boolean)
    .join(", ");

  const deliveryAddressValue = address
    ? [address.addressLine, locationText].filter(Boolean).join(", ") || translate("Address on file", "عنوان مسجل")
    : contract.legacyNumber
      ? translate("Not recorded", "غير مسجل")
      : translate("Factory", "المصنع");

  const sharedUnitColumns = visibleUnitColumns(contract.items.flatMap((item) => item.productUnits));

  return (
    <div className="flex flex-col gap-5 text-xs text-gray-900">
      <header className="relative flex items-center justify-between gap-4 border-b border-gray-300 pb-2">
        <PrintOrgHeader />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
              {translate("Contract Review", "مراجعة عقد")}
            </p>
            <h1 className="font-mono text-2xl font-semibold">{contract.code}</h1>
          </div>
        </div>
        <img src={logoSrc} alt="" width={100} height={100} className="h-24 w-24 shrink-0 rounded object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 [&>div>span:last-child]:text-[11px]">
        <PrintDetail label={translate("Customer", "العميل")} value={contract.customer.name} />
        {contract.legacyNumber ? (
          <PrintDetail
            label={translate("Legacy number", "رقم مراجعة العقد")}
            value={contract.legacyNumber || contract.code}
            mono
          />
        ) : null}
        <PrintDetail
          label={translate("Contract review date", "تاريخ مراجعة العقد")}
          value={formatDateAndTime(contract.createdAt, locale)}
        />
        <PrintDetail label={translate("Delivery address", "عنوان التسليم")} value={deliveryAddressValue} />
        {contract.deliveryTime ? (
          <PrintDetail
            label={translate("Delivery time", "موعد التسليم")}
            value={formatDateAndTime(contract.deliveryTime, locale)}
          />
        ) : null}
        {contract.completedAt ? (
          <PrintDetail
            label={translate("Completed at", "تاريخ الإكمال")}
            value={formatDateAndTime(contract.completedAt, locale)}
          />
        ) : null}
        {contract.discountPct != null ? (
          <PrintDetail label={translate("Discount", "الخصم")} value={`${contract.discountPct}%`} />
        ) : null}
        <PrintDetail
          label={translate(`Total (${currency})`, `الإجمالي (${currency})`)}
          value={contract.totalAmount == null ? translate("Not priced", "غير مسعّر") : formatMoney(contract.totalAmount)}
        />
        {contract.cancelledAt ? (
          <PrintDetail
            label={translate("Cancelled at", "تاريخ الإلغاء")}
            value={formatDateAndTime(contract.cancelledAt, locale)}
          />
        ) : null}
        {contract.cancellationReason?.trim() ? (
          <PrintDetail label={translate("Cancellation reason", "سبب الإلغاء")} value={contract.cancellationReason.trim()} />
        ) : null}
        {contract.notes?.trim() ? (
          <PrintDetail label={translate("Notes", "الملاحظات")} value={contract.notes.trim()} />
        ) : null}
      </section>

      <hr className="border-gray-300" />

      {contract.items.length === 0 ? (
        <p className="py-2 text-[10px] text-gray-500">
          {translate("No items on this contract review", "لا توجد بنود في مراجعة العقد هذه")}
        </p>
      ) : variant === "items" ? (
        <ContractItemsPrintTable
          items={contract.items}
          currency={currency}
          dimensionUnit={dimensionUnit}
          translate={translate}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {contract.items.map((item, index) => (
            <ContractItemPrintBlock
              key={item.id}
              item={item}
              index={index}
              locale={locale}
              currency={currency}
              dimensionUnit={dimensionUnit}
              unitColumns={sharedUnitColumns}
              translate={translate}
            />
          ))}
        </div>
      )}

      <hr className="border-gray-300" />

      <section className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 [&>div>span:last-child]:text-[11px]">
        {contract.legacyWorkOrderNumber ? (
          <PrintDetail label={translate("Work order number", "رقم أمر الشغل")} value={contract.legacyWorkOrderNumber} mono />
        ) : null}
        {contract.startedAt ? (
          <PrintDetail
            label={translate("Work order start", "بداية أمر الشغل")}
            value={formatDateAndTime(contract.startedAt, locale)}
          />
        ) : null}
        <PrintDetail label={translate("Printing date", "تاريخ الطباعة")} value={printedAt} />
      </section>
    </div>
  );
}
